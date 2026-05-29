import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  RefreshCw, AlertCircle, Bug, Clock, CheckCircle, Loader2, Calendar, ClipboardList, TrendingUp, ShieldAlert, Users, MessageSquare, Download
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = "http://localhost/anialerto-backend/src/get_reports_data.php";

function fmtDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [batchId, setBatchId] = useState<string>("");
  const [workerId, setWorkerId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (batchId) queryParams.append("batch_id", batchId);
      if (workerId) queryParams.append("worker_id", workerId);
      if (category) queryParams.append("category", category);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const res = await fetch(`${API}?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [batchId, workerId, category, startDate, endDate]);

  const handleGeneratePDF = async () => {
    if (!data) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 100)); // allow UI update
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 15;
      const GREEN: [number, number, number] = [93, 128, 68];
      const DGRAY: [number, number, number] = [55, 65, 81];
      const LGREEN: [number, number, number] = [229, 245, 220];
      
      // Header
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AniAlerto Farm Operations Report", W / 2, 11, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, W / 2, 19, { align: "center" });
      doc.setTextColor(...DGRAY);
      y = 35;

      const addSection = (title: string, shows: string, useful: string) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GREEN);
        doc.text(title, 14, y);
        y += 5;

        doc.setTextColor(...DGRAY);
        doc.setFontSize(9);
        
        doc.setFont("helvetica", "bold");
        doc.text("Shows:", 14, y);
        doc.setFont("helvetica", "normal");
        const showsLines = doc.splitTextToSize(shows, W - 32);
        doc.text(showsLines, 28, y);
        y += (showsLines.length * 4) + 1;

        doc.setFont("helvetica", "bold");
        doc.text("Why useful:", 14, y);
        doc.setFont("helvetica", "normal");
        const usefulLines = doc.splitTextToSize(useful, W - 36);
        doc.text(usefulLines, 34, y);
        y += (usefulLines.length * 4) + 3;
      };

      // 1. Farm Task Completion Report
      if (data.taskCompletion) {
        addSection(
          "1. Farm Task Completion Report",
          "completed farm activities, pending tasks, delayed tasks, cancelled tasks",
          "Helps admin monitor whether farm operations are actually being performed."
        );
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Status", "Count"]],
          body: [
            ["Completed", String(data.taskCompletion.Completed || 0)],
            ["Pending", String(data.taskCompletion.Pending || 0)],
            ["Delayed", String(data.taskCompletion.Delayed || 0)],
            ["Cancelled", String(data.taskCompletion.Cancelled || 0)],
          ],
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      // 2. Worker Response Monitoring Report
      if (data.workerMonitoring && data.workerMonitoring.length > 0) {
        addSection(
          "2. Worker Response Monitoring Report",
          "workers who responded, workers who did not respond, frequent DELAY (and their reasons) or HELP responses, response time",
          "Helps identify workers needing supervision or assistance."
        );
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Worker", "Assigned", "DONE", "DELAY", "HELP/PEST", "Avg Response"]],
          body: data.workerMonitoring.map((w: any) => [
            w.name, String(w.total_sent), String(w.done_count), String(w.delay_count), String(w.help_count), w.avg_response_time ? `${w.avg_response_time} mins` : "-"
          ]),
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      if (data.delayEvents && data.delayEvents.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GREEN);
        doc.text("Reported Delay Reasons", 14, y);
        y += 5;
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Timestamp", "Worker", "Batch", "Task", "Delay Reason"]],
          body: data.delayEvents.map((d: any) => [
            fmtDate(d.timestamp), d.workerName || "Unknown", d.batchName || "-", d.taskName || "-", d.reason || "-"
          ]),
          headStyles: { fillColor: [202, 138, 4] },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      if (data.helpEvents && data.helpEvents.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GREEN);
        doc.text("Reported Help Requests", 14, y);
        y += 5;
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Timestamp", "Worker", "Batch", "Category", "Subcategory"]],
          body: data.helpEvents.map((h: any) => [
            fmtDate(h.timestamp), h.workerName || "Unknown", h.batchName || "-", h.category || "-", h.subcategory || "-"
          ]),
          headStyles: { fillColor: [220, 38, 38] },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      // 3. Upcoming Farm Activities Report
      if (data.upcomingActivities && data.upcomingActivities.length > 0) {
        addSection(
          "3. Upcoming Farm Activities Report",
          "upcoming schedules, activities due soon, affected farm batches",
          "Helps admin prepare labor, fertilizer, pesticide, and equipment ahead of time."
        );
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Due Date", "Batch", "Activity", "Category"]],
          body: data.upcomingActivities.map((a: any) => [
            fmtDate(a.due_date), a.batchName, a.taskName, a.category || "General"
          ]),
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      // 4. Pest and Emergency Alert Report
      if (data.pestAlerts && data.pestAlerts.length > 0) {
        addSection(
          "4. Pest and Emergency Alert Report",
          "HELP reports, PEST reports, urgent worker concerns",
          "Helps admin respond quickly to field problems."
        );
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Date", "Worker", "Alert Type"]],
          body: data.pestAlerts.map((a: any) => [
            fmtDate(a.received_at || a.created_at), a.workerName || "Unknown", a.alertType
          ]),
          headStyles: { fillColor: [185, 28, 28] }, // Red header
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      // 5. Farm Batch Progress Report
      if (data.batchProgress && data.batchProgress.length > 0) {
        addSection(
          "5. Farm Batch Progress Report",
          "crop day/stage, current farm status, completed activities per batch",
          "Gives admin an overview of farm progress."
        );
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Batch Name", "Status", "Crop Age", "Progress"]],
          body: data.batchProgress.map((b: any) => [
            b.name, b.status, b.cropDay !== null ? `Day ${b.cropDay}` : "-", `${b.progress}% (${b.tasksCompleted}/${b.tasksTotal})`
          ]),
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 12;
      }

      // 6. Advisory Effectiveness Report
      if (data.advisoryEffectiveness) {
        addSection(
          "6. Advisory Effectiveness Report",
          "percentage of acknowledged tasks, tasks completed after reminders, delayed task trends",
          "Measures whether advisories are effective."
        );
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Metric", "Value"]],
          body: [
            ["Total Sent", String(data.advisoryEffectiveness.totalSent)],
            ["Acknowledged Tasks", data.advisoryEffectiveness.totalSent ? `${Math.round((data.advisoryEffectiveness.acknowledged / data.advisoryEffectiveness.totalSent) * 100)}%` : '0%'],
            ["Delayed Responses", String(data.advisoryEffectiveness.delayed)],
          ],
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 18;
      }



      doc.save(`Farm_Operations_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center h-96">
      <Loader2 className="h-10 w-10 animate-spin text-[#8acb88] mb-4" />
      <p className="text-gray-500 animate-pulse">Loading operations data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Farm Operations Reports</h1>
          <p className="text-[#556d4a]">Actionable insights into farm progress, worker engagement, and alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-[#3d5a36] border-[#d9ead6] bg-white hover:bg-[#eff7eb]" onClick={handleGeneratePDF} disabled={generating || !data}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} 
            Download PDF
          </Button>
          <Button className="bg-[#5d8044] hover:bg-[#4a6b36] text-white border border-[#7a9b5c]" onClick={fetchData}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />} 
            Refresh Data
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}. Please check if XAMPP is running.</p>
        </div>
      )}

      {/* Global Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border border-[#d9ead6] shadow-xl shadow-[#a4c692]/10 bg-white rounded-2xl">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">Farm Batch</Label>
              <select className="w-full border rounded-md h-10 px-3 bg-white shadow-sm border-[#d9ead6] text-sm text-[#556d4a]"
                value={batchId} onChange={e => setBatchId(e.target.value)}>
                <option value="">All Batches</option>
                {data?.filterOptions?.batches?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">Worker</Label>
              <select className="w-full border rounded-md h-10 px-3 bg-white shadow-sm border-[#d9ead6] text-sm text-[#556d4a]"
                value={workerId} onChange={e => setWorkerId(e.target.value)}>
                <option value="">All Workers</option>
                {data?.filterOptions?.workers?.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">Category</Label>
              <select className="w-full border rounded-md h-10 px-3 bg-white shadow-sm border-[#d9ead6] text-sm text-[#556d4a]"
                value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {data?.filterOptions?.categories?.map((c: any) => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">Start Date</Label>
              <Input type="date" className="h-10 border-[#d9ead6]" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">End Date</Label>
              <Input type="date" className="h-10 border-[#d9ead6]" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="bg-[#e4fde1] border border-[#d9ead6] p-1 rounded-xl mb-4 w-full justify-start h-auto overflow-x-auto">
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:text-[#3d5a36] text-[#556d4a] rounded-lg px-4 py-2 font-medium">Task & Batch Progress</TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-[#3d5a36] text-[#556d4a] rounded-lg px-4 py-2 font-medium">Upcoming Activities</TabsTrigger>
          <TabsTrigger value="workers" className="data-[state=active]:bg-white data-[state=active]:text-[#3d5a36] text-[#556d4a] rounded-lg px-4 py-2 font-medium">Worker Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-white data-[state=active]:text-[#3d5a36] text-[#556d4a] rounded-lg px-4 py-2 font-medium">Alerts & Effectiveness</TabsTrigger>
        </TabsList>

        {/* TAB 1: Task & Batch Progress */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Completed Tasks" value={data?.taskCompletion?.Completed || 0} icon={<CheckCircle className="h-5 w-5"/>} color="border-l-green-500" textColor="text-green-700"/>
            <StatCard title="Pending Tasks" value={data?.taskCompletion?.Pending || 0} icon={<Clock className="h-5 w-5"/>} color="border-l-blue-500" textColor="text-blue-700"/>
            <StatCard title="Delayed Tasks" value={data?.taskCompletion?.Delayed || 0} icon={<AlertCircle className="h-5 w-5"/>} color="border-l-yellow-500" textColor="text-yellow-700"/>
            <StatCard title="Cancelled Tasks" value={data?.taskCompletion?.Cancelled || 0} icon={<AlertCircle className="h-5 w-5"/>} color="border-l-gray-400" textColor="text-gray-500"/>
          </div>

          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-xl shadow-[#a4c692]/10 bg-white">
            <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0] rounded-t-[1.5rem]">
              <CardTitle className="text-[#3d5a36] flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Farm Batch Progress</CardTitle>
              <CardDescription>Overview of task completion and crop age for active batches.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Crop Age</TableHead>
                    <TableHead>Task Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.batchProgress?.length > 0 ? data.batchProgress.map((b: any) => (
                    <TableRow key={b.id} className="hover:bg-[#eff7ed]">
                      <TableCell className="font-medium text-[#3d5a36]">{b.name}</TableCell>
                      <TableCell><Badge variant="outline" className={b.status === 'Active' ? "border-green-300 text-green-700 bg-green-50" : ""}>{b.status}</Badge></TableCell>
                      <TableCell className="text-[#556d4a]">{b.cropDay !== null ? `Day ${b.cropDay}` : '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[150px]">
                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${b.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{b.progress}% ({b.tasksCompleted}/{b.tasksTotal})</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">No batches found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Upcoming Activities */}
        <TabsContent value="upcoming">
          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-xl shadow-[#a4c692]/10 bg-white">
            <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0] rounded-t-[1.5rem]">
              <CardTitle className="text-[#3d5a36] flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Farm Activities</CardTitle>
              <CardDescription>Schedules due soon requiring labor or material preparation.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Activity / Task</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.upcomingActivities?.length > 0 ? data.upcomingActivities.map((a: any) => (
                    <TableRow key={a.id} className="hover:bg-[#eff7ed]">
                      <TableCell className="font-medium text-[#3d5a36]">{fmtDate(a.due_date)}</TableCell>
                      <TableCell className="text-[#556d4a]">{a.batchName}</TableCell>
                      <TableCell className="font-semibold text-[#5d8044]">{a.taskName}</TableCell>
                      <TableCell><Badge variant="outline">{a.category || 'General'}</Badge></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">No upcoming activities found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Worker Analytics */}
        <TabsContent value="workers" className="space-y-4">
          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-xl shadow-[#a4c692]/10 bg-white">
            <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0] rounded-t-[1.5rem]">
              <CardTitle className="text-[#3d5a36] flex items-center gap-2"><Users className="h-5 w-5" /> Worker Response Monitoring</CardTitle>
              <CardDescription>Identify workers needing supervision, based on response rates and delays.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Tasks Assigned</TableHead>
                    <TableHead>Completed (DONE)</TableHead>
                    <TableHead>Delayed (DELAY)</TableHead>
                    <TableHead>Issues (HELP/PEST)</TableHead>
                    <TableHead>Avg. Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.workerMonitoring?.length > 0 ? data.workerMonitoring.map((w: any) => (
                    <TableRow key={w.id} className="hover:bg-[#eff7ed]">
                      <TableCell>
                        <p className="font-medium text-[#3d5a36]">{w.name}</p>
                        <p className="text-xs text-gray-500">{w.phone}</p>
                      </TableCell>
                      <TableCell className="text-gray-600 font-semibold">{w.total_sent}</TableCell>
                      <TableCell><Badge className="bg-green-50 text-green-700 border-green-200">{w.done_count}</Badge></TableCell>
                      <TableCell><Badge className={w.delay_count > 0 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-gray-50 text-gray-400 border-gray-200"}>{w.delay_count}</Badge></TableCell>
                      <TableCell><Badge className={w.help_count > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-400 border-gray-200"}>{w.help_count}</Badge></TableCell>
                      <TableCell className="text-[#556d4a]">{w.avg_response_time ? `${w.avg_response_time} min(s)` : '-'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-500">No worker responses found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delay Reasons Table */}
          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-xl shadow-[#a4c692]/10 bg-white">
            <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0] rounded-t-[1.5rem]">
              <CardTitle className="text-[#3d5a36] flex items-center gap-2"><Clock className="h-5 w-5" /> Reported Delay Reasons</CardTitle>
              <CardDescription>Reasons provided by workers for delayed tasks.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Worker Name</TableHead>
                    <TableHead>Assigned Batch</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Delay Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.delayEvents?.length > 0 ? data.delayEvents.map((d: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-[#eff7ed]">
                      <TableCell className="text-gray-500 whitespace-nowrap">{fmtDate(d.timestamp)}</TableCell>
                      <TableCell className="font-medium text-[#3d5a36]">{d.workerName || "Unknown"}</TableCell>
                      <TableCell>{d.batchName || "-"}</TableCell>
                      <TableCell>{d.taskName || "-"}</TableCell>
                      <TableCell className="text-yellow-700 italic">{d.reason || "-"}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-500">No delay reasons reported.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Help Requests Table */}
          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-xl shadow-[#a4c692]/10 bg-white">
            <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0] rounded-t-[1.5rem]">
              <CardTitle className="text-[#3d5a36] flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /> Help Requests</CardTitle>
              <CardDescription>Specific assistance requested by workers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Worker Name</TableHead>
                    <TableHead>Assigned Batch</TableHead>
                    <TableHead>HELP Category</TableHead>
                    <TableHead>HELP Subcategory</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.helpEvents?.length > 0 ? data.helpEvents.map((h: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-[#eff7ed]">
                      <TableCell className="text-gray-500 whitespace-nowrap">{fmtDate(h.timestamp)}</TableCell>
                      <TableCell className="font-medium text-[#3d5a36]">{h.workerName || "Unknown"}</TableCell>
                      <TableCell>{h.batchName || "-"}</TableCell>
                      <TableCell><Badge className="bg-red-50 text-red-700 border-red-200">{h.category || "-"}</Badge></TableCell>
                      <TableCell className="text-red-700">{h.subcategory || "-"}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-500">No help requests reported.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </TabsContent>

        {/* TAB 4: Alerts & Effectiveness */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Advisories Sent" value={data?.advisoryEffectiveness?.totalSent || 0} icon={<MessageSquare className="h-5 w-5"/>} color="border-l-[#5d8044]" textColor="text-[#3d5a36]"/>
            <StatCard title="Acknowledged Rate" value={data?.advisoryEffectiveness?.totalSent ? `${Math.round((data.advisoryEffectiveness.acknowledged / data.advisoryEffectiveness.totalSent) * 100)}%` : '0%'} icon={<TrendingUp className="h-5 w-5"/>} color="border-l-green-500" textColor="text-green-700"/>
            <StatCard title="Total Delays" value={data?.advisoryEffectiveness?.delayed || 0} icon={<Clock className="h-5 w-5"/>} color="border-l-yellow-500" textColor="text-yellow-700"/>
          </div>

          <Card className="border border-red-200 rounded-[1.5rem] shadow-xl shadow-red-900/5 bg-white">
            <CardHeader className="bg-red-50 p-6 border-b border-red-100 rounded-t-[1.5rem]">
              <CardTitle className="text-red-800 flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Pest and Emergency Alerts</CardTitle>
              <CardDescription className="text-red-600">Urgent issues reported by field workers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Alert Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.pestAlerts?.length > 0 ? data.pestAlerts.map((a: any) => (
                    <TableRow key={a.id} className="hover:bg-red-50/50">
                      <TableCell className="font-medium text-red-900">{fmtDate(a.received_at || a.created_at)}</TableCell>
                      <TableCell>
                        <p className="font-medium text-red-800">{a.workerName || 'Unknown'}</p>
                        <p className="text-xs text-red-500">{a.phone}</p>
                      </TableCell>
                      <TableCell><Badge className="bg-red-100 text-red-800 border-red-300">{a.alertType}</Badge></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={3} className="text-center py-6 text-gray-500">No alerts found for this period.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: { title: string; value: string | number; icon: ReactNode; color: string; textColor: string }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className={`border-l-4 ${color} rounded-[1.5rem] bg-gradient-to-br from-white to-[#f8fdf3] shadow-xl shadow-[#a4c692]/20 border-[#d9ead6]`}>
        <CardContent className="p-5 flex justify-between items-center gap-3">
          <div>
            <p className="text-[10px] font-bold text-[#7b8f6f] uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#eff7ec] text-[#5d8044] shadow-sm">{icon}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
