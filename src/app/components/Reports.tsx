import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  RefreshCw, Clock, CheckCircle, Loader2, Info, ClipboardList, TrendingUp, ShieldAlert, Users, Download, AlertTriangle, FileText, Sprout, Activity, Database, AlertCircle, MessageSquare
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/get_reports_data.php` : "https://lightpink-cattle-667968.hostingersite.com/api/get_reports_data.php";

function fmtDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [reportType, setReportType] = useState<string>("activity");
  const [batchId, setBatchId] = useState<string>("");
  const [workerId, setWorkerId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [availableWorkers, setAvailableWorkers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch(`${API}?report_type=none`)
      .then(res => res.json())
      .then(d => {
        if (!data) setData({ filterOptions: d.filterOptions });
      })
      .catch(e => console.error("Filter load error", e));
  }, []);

  useEffect(() => {
    if (reportType !== "export") {
      setWorkerId("");
    }
    if (data?.filterOptions) {
      if (batchId) {
        const allowedWorkerIds = data.filterOptions.batchWorkers?.[batchId] || [];
        const workers = allowedWorkerIds.map((id: string) => ({
          id, name: data.filterOptions.workersMap?.[id] || "Unknown Worker"
        }));
        setAvailableWorkers(workers);
      } else {
        const allWorkers = Object.entries(data.filterOptions.workersMap || {}).map(([id, name]) => ({ id, name: String(name) }));
        setAvailableWorkers(allWorkers);
      }
    }
  }, [reportType, batchId, data?.filterOptions]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("report_type", reportType);
      if (batchId) queryParams.append("batch_id", batchId);
      if (workerId && reportType === "export") queryParams.append("worker_id", workerId);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const res = await fetch(`${API}?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const raw = await res.text();
      try {
          const parsed = JSON.parse(raw);
          setData(parsed);
      } catch(je) {
          throw new Error("Invalid response from server. Check XAMPP/Live connection.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!data) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 100));
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 15;
      const GREEN: [number, number, number] = [93, 128, 68];
      const DGRAY: [number, number, number] = [55, 65, 81];

      // Header
      doc.setFillColor(...GREEN);
      doc.rect(0, 0, W, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      
      const typeLabel = reportType === 'activity' ? "Activity / Operational Report" : 
                        reportType === 'analytical' ? "Analytical / Summary Report" : "Individual Worker & Batch Export";
      doc.text(typeLabel, W / 2, 11, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString("en-PH")}`, W / 2, 19, { align: "center" });
      
      const bName = data.filterOptions?.batches?.find((b:any)=>b.id===batchId)?.name || "All Batches";
      const dateRangeStr = (startDate || endDate) ? `${startDate ? fmtDate(startDate) : 'Start'} to ${endDate ? fmtDate(endDate) : 'Present'}` : 'All Time';
      let filterText = `Filters: Batch: ${bName} | Date: ${dateRangeStr}`;
      if (reportType === 'export') {
          const wName = workerId ? data.filterOptions?.workersMap?.[workerId] : "All Workers";
          filterText += ` | Worker: ${wName}`;
      }
      doc.text(filterText, W / 2, 23, { align: "center" });

      doc.setTextColor(...DGRAY);
      y = 35;

      const checkPageBreak = (needed: number) => {
          if (y + needed > 280) { doc.addPage(); y = 20; }
      };

      // 1. Activity Report
      if (reportType === 'activity' && data.activityReport) {
        const a = data.activityReport;
        
        if (a.context) {
            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
            doc.text("Farm & Crop Context", 14, y); y+=6;
            doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...DGRAY);
            doc.text(`Batch Name: ${a.context.name}`, 14, y);
            doc.text(`Variety: ${a.context.variety}`, 100, y); y+=5;
            doc.text(`Planting Date: ${a.context.plantingDate}`, 14, y);
            doc.text(`Current Crop Stage: ${a.context.stage}`, 100, y); y+=10;
        }

        checkPageBreak(30);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Task Execution & Status Breakdown", 14, y); y+=5;
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Assigned", "Done", "Late Finish", "Delay Reported", "No Response"]],
          body: [[String(a.taskExecution.assigned), String(a.taskExecution.done), String(a.taskExecution.delayedDone), String(a.taskExecution.delay), String(a.taskExecution.overdue)]],
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        if (a.assignedTasks && a.assignedTasks.length > 0) {
            checkPageBreak(40);
            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
            doc.text("Assigned Tasks", 14, y); y+=5;
            autoTable(doc, {
              startY: y, margin: { left: 14 },
              head: [["Task Name", "Due Date", "Status"]],
              body: a.assignedTasks.map((t: any) => [t.task_name, t.due_date, t.status]),
              headStyles: { fillColor: GREEN },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        }

        checkPageBreak(30);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Worker SMS Responses", 14, y); y+=5;
        autoTable(doc, {
          startY: y, margin: { left: 14 },
          head: [["Total DONE", "Total HELP", "Total PEST", "Total DELAY"]],
          body: [[String(a.workerResponses.done), String(a.workerResponses.helpCount), String(a.workerResponses.pest), String(a.workerResponses.delay)]],
          headStyles: { fillColor: [59, 130, 246] },
        });
        y = (doc as any).lastAutoTable.finalY + 3;

        if (a.workerResponses.helpTypes?.length > 0 || a.workerResponses.pestTypes?.length > 0 || a.workerResponses.delayTypes?.length > 0) {
            doc.setFontSize(10); doc.setFont("helvetica", "italic"); doc.setTextColor(50, 50, 50);
            if (a.workerResponses.helpTypes?.length > 0) {
                const helpBreakdown = a.workerResponses.helpTypes.map((h: any) => `${h.type}: ${h.count}`).join(" | ");
                doc.text(`HELP Breakdown: ${helpBreakdown}`, 14, y); y += 6;
            }
            if (a.workerResponses.pestTypes?.length > 0) {
                const pestBreakdown = a.workerResponses.pestTypes.map((h: any) => `${h.type}: ${h.count}`).join(" | ");
                doc.text(`PEST Breakdown: ${pestBreakdown}`, 14, y); y += 6;
            }
            if (a.workerResponses.delayTypes?.length > 0) {
                const delayBreakdown = a.workerResponses.delayTypes.map((h: any) => `${h.type}: ${h.count}`).join(" | ");
                doc.text(`DELAY Breakdown: ${delayBreakdown}`, 14, y); y += 6;
            }
            y += 2;
        } else {
            y += 5;
        }

        if (a.timeline && a.timeline.length > 0) {
            checkPageBreak(50);
            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
            doc.text("Response Tracking (Timeline)", 14, y); y+=5;
            autoTable(doc, {
              startY: y, margin: { left: 14 },
              head: [["Timestamp", "Worker Name", "Response Action"]],
              body: a.timeline.map((t: any) => [fmtDate(t.timestamp), t.workerName || "Unknown", t.action || "Pending"]),
              headStyles: { fillColor: [100, 116, 139] },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        }

        checkPageBreak(40);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("System Alerts & Monitoring", 14, y); y+=5;
        const alertsData = [
            ...a.systemAlerts.missedTasks.map((t:any) => ["Missed Task", `${t.task} (Due: ${t.due})`]),
            ...a.systemAlerts.failedSMS.map((f:any) => ["Failed SMS", `${f.phone_number}: ${f.error_message}`]),
            ...a.systemAlerts.unresponsive.map((u:any) => ["Unresponsive", `Worker: ${u}`])
        ];
        if (alertsData.length > 0) {
            autoTable(doc, { startY: y, head: [["Alert Type", "Details"]], body: alertsData, headStyles: { fillColor: [220, 38, 38] } });
            y = (doc as any).lastAutoTable.finalY + 8;
        } else {
            doc.setFontSize(10); doc.setFont("helvetica", "italic"); doc.text("No active system alerts.", 14, y); y+=8;
        }
      }

      // 2. Analytical Report
      if (reportType === 'analytical' && data.analyticalReport) {
        const an = data.analyticalReport;

        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Core Performance Metrics", 14, y); y+=5;
        autoTable(doc, {
          startY: y, head: [["Task Completion Rate", "Worker Responsiveness", "SMS Delivery Rate"]],
          body: [[`${an.systemEffectiveness.taskCompletionRate}%`, `${an.systemEffectiveness.workerResponsivenessRate}%`, `${an.systemEffectiveness.smsDeliverySuccessRate}%`]],
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        if (an.frequencyAnalysis) {
            checkPageBreak(40);
            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
            doc.text("Frequency Analysis (Alerts & Reports)", 14, y); y+=5;
            const freqData: any[] = [];
            an.frequencyAnalysis.help?.forEach((h:any) => freqData.push(["HELP", h.category, h.count]));
            an.frequencyAnalysis.delay?.forEach((d:any) => freqData.push(["DELAY", d.category, d.count]));
            an.frequencyAnalysis.pest?.forEach((p:any) => freqData.push(["PEST", p.category, p.count]));
            
            if (freqData.length > 0) {
                autoTable(doc, {
                    startY: y, head: [["Type", "Category/Reason", "Frequency Count"]],
                    body: freqData,
                    headStyles: { fillColor: [245, 158, 11] }, // Amber
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            } else {
                doc.setFontSize(10); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
                doc.text("No frequency data recorded yet.", 14, y); y+=8;
            }
        }

        checkPageBreak(50);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Crop Lifecycle Performance", 14, y); y+=5;
        const clData = Object.entries(an.cropLifecycle).map(([stage, metrics]: any) => [stage, metrics.done, metrics.delay, metrics.pest || 0]);
        autoTable(doc, { startY: y, head: [["Crop Stage", "Tasks Done", "Tasks Delayed", "Pest Occurrences"]], body: clData, headStyles: { fillColor: [59, 130, 246] } });
        y = (doc as any).lastAutoTable.finalY + 8;

        checkPageBreak(50);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Worker Performance Ranking", 14, y); y+=5;
        autoTable(doc, {
          startY: y, head: [["Rank", "Worker Name", "Responsiveness", "Unresponsive", "Done", "Delay"]],
          body: an.workerRankings.map((w: any, idx: number) => [ `#${idx+1}`, w.name, `${w.responsiveness}%`, String(w.unresponsiveIncidents), String(w.done), String(w.delay) ]),
          headStyles: { fillColor: [55, 65, 81] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // 3. Export Report
      if (reportType === 'export' && data.exportReport) {
        const ex = data.exportReport;

        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Profiles & Context Summary", 14, y); y+=6;
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(...DGRAY);
        if (ex.profiles.batchDetails) {
            doc.text(`Batch: ${ex.profiles.batchDetails.name} (${ex.profiles.batchDetails.cropType})`, 14, y);
            doc.text(`Stage: ${ex.profiles.batchDetails.stage}`, 100, y); y+=5;
        }
        if (workerId) {
            const ww = ex.profiles.workers.find((w:any)=>w.name === data.filterOptions.workersMap[workerId]);
            if (ww) doc.text(`Worker Profile: ${ww.name} (${ww.phone_number})`, 14, y); y+=5;
        }

        checkPageBreak(30);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Aggregated Performance Metrics", 14, y); y+=5;
        autoTable(doc, {
          startY: y, head: [["Overall Responsiveness Rate"]],
          body: [[`${ex.aggregated.responsiveness}%`]],
          headStyles: { fillColor: GREEN },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        checkPageBreak(40);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Task Performance Breakdown", 14, y); y+=5;
        autoTable(doc, {
          startY: y, head: [["Completed On-Time", "Completed Delayed", "Active Delays", "Missed / Unresponsive"]],
          body: [[String(ex.taskPerformance.onTime), String(ex.taskPerformance.delayedDone), String(ex.taskPerformance.activeDelays), String(ex.taskPerformance.unresponsive)]],
          headStyles: { fillColor: [59, 130, 246] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;

        checkPageBreak(60);
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text("Timeline Performance Matrix", 14, y); y+=5;
        const tmData = Object.entries(ex.timelineMatrix).map(([stage, count]) => [stage, count]);
        autoTable(doc, { startY: y, head: [["Crop Stage", "Total Interactions"]], body: tmData, headStyles: { fillColor: [59, 130, 246] } });
        y = (doc as any).lastAutoTable.finalY + 8;

        if (ex.logs && ex.logs.length > 0) {
            checkPageBreak(50);
            checkPageBreak(50);
            doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
            doc.text("SMS Interaction Logs", 14, y); y+=5;
            autoTable(doc, {
                startY: y, head: [["Timestamp", "Worker", "Task", "Reply"]],
                body: ex.logs.map((l: any) => [ fmtDate(l.created_at), l.workerName || "-", l.taskName || "-", l.response_text ]),
                headStyles: { fillColor: [100, 116, 139] },
            });
        }
      }

      doc.save(`Farm_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto pb-20">

      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Farm Operations Dashboard</h1>
          <p className="text-[#556d4a]">Strict analytical reporting views.</p>
        </div>
      </motion.div>

      {/* Global Filter Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border border-[#d9ead6] shadow-xl shadow-[#a4c692]/10 bg-white rounded-2xl">
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-5 gap-5 items-end">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1"><FileText className="w-3 h-3"/> Report Type (Required)</Label>
              <select className="w-full border-2 border-blue-200 rounded-md h-10 px-3 bg-blue-50 shadow-sm text-sm text-blue-900 font-bold focus:ring-blue-500" value={reportType} onChange={e => { setReportType(e.target.value); setData(prev => prev ? {...prev, activityReport: null, analyticalReport: null, exportReport: null} : null); }}>
                <option value="activity">1. Activity / Operational Report</option>
                <option value="analytical">2. Analytical / Summary Report</option>
                <option value="export">3. Individual Worker & Batch Export</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2 md:col-start-1">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">Farm Batch</Label>
              <select className="w-full border rounded-md h-10 px-3 bg-white shadow-sm border-[#d9ead6] text-sm text-[#556d4a]" value={batchId} onChange={e => setBatchId(e.target.value)}>
                <option value="">-- Select a Batch (Required) --</option>
                {data?.filterOptions?.batches?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className={`text-xs font-bold uppercase ${reportType === 'export' ? 'text-amber-700' : 'text-gray-400'}`}>
                Worker Filter {reportType !== 'export' && '(Disabled)'}
              </Label>
              <select 
                className={`w-full border rounded-md h-10 px-3 shadow-sm text-sm ${reportType === 'export' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}`} 
                value={workerId} onChange={e => setWorkerId(e.target.value)} disabled={reportType !== 'export'}
              >
                <option value="">All Assigned Workers</option>
                {availableWorkers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">Start Date</Label>
              <Input type="date" className="h-10 border-[#d9ead6]" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-bold text-[#7b8f6f] uppercase">End Date</Label>
              <Input type="date" className="h-10 border-[#d9ead6]" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex gap-2">
                <Button className="flex-1 bg-[#5d8044] hover:bg-[#4a6b36] text-white font-bold" onClick={handleGenerateReport} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Generate
                </Button>
                <Button variant="outline" className="text-[#3d5a36] border-[#d9ead6] bg-white hover:bg-[#eff7eb]" onClick={handleGeneratePDF} disabled={generating || loading || (!data?.activityReport && !data?.analyticalReport && !data?.exportReport)}>
                    {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    PDF
                </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <div className="flex flex-col items-center justify-center h-64 bg-white border border-red-200 rounded-2xl">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
          <p className="text-red-700 font-bold mb-2">Failed to load report data</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      )}
      
      {loading && !error && (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-[#8acb88] mb-4" />
          <p className="text-gray-500 animate-pulse">Generating...</p>
        </div>
      )}

      {/* REPORT CONTENT AREA */}
      {!loading && !error && (
        <div className="mt-8 space-y-8">
            
            {/* 1. ACTIVITY REPORT */}
            {reportType === 'activity' && data?.activityReport && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#3d5a36] border-b border-[#d9ead6] pb-2">Activity / Operational Report</h2>
                    
                    {/* A. Farm Context */}
                    {data.activityReport.context && (
                        <Card className="border-l-4 border-[#5d8044] bg-white shadow-sm">
                            <CardContent className="p-4 flex gap-8 items-center">
                                <Sprout className="w-8 h-8 text-[#5d8044]" />
                                <div><p className="text-xs text-gray-500 uppercase font-bold">Active Batch</p><p className="text-lg font-bold text-[#3d5a36]">{data.activityReport.context.name} ({data.activityReport.context.variety})</p></div>
                                <div><p className="text-xs text-gray-500 uppercase font-bold">Planting Date</p><p className="font-medium">{data.activityReport.context.plantingDate}</p></div>
                                <div><p className="text-xs text-gray-500 uppercase font-bold">Crop Stage</p><p className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">{data.activityReport.context.stage}</p></div>
                            </CardContent>
                        </Card>
                    )}

                    {/* B & C. Task Breakdown */}
                    <h3 className="text-lg font-bold text-gray-700 mt-6"><Activity className="inline w-5 h-5 mr-1 text-[#5d8044]"/> Task Execution Monitoring</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <StatCard title="Assigned Tasks" value={data.activityReport.taskExecution?.assigned || 0} icon={<ClipboardList className="h-5 w-5" />} color="border-l-blue-500" textColor="text-blue-700" />
                        <StatCard title="Done" value={data.activityReport.taskExecution?.done || 0} icon={<CheckCircle className="h-5 w-5" />} color="border-l-green-500" textColor="text-green-700" />
                        <StatCard title="Late Finish" value={data.activityReport.taskExecution?.delayedDone || 0} icon={<CheckCircle className="h-5 w-5" />} color="border-l-emerald-600" textColor="text-emerald-700" />
                        <StatCard title="Delay Reported" value={data.activityReport.taskExecution?.delay || 0} icon={<Clock className="h-5 w-5" />} color="border-l-amber-500" textColor="text-amber-700" />
                        <StatCard title="No Response" value={data.activityReport.taskExecution?.overdue || 0} icon={<AlertTriangle className="h-5 w-5" />} color="border-l-red-600" textColor="text-red-800" />
                    </div>

                    {/* D. Assigned Tasks per batch */}
                    {data.activityReport.assignedTasks && data.activityReport.assignedTasks.length > 0 && (
                        <Card className="bg-white border-[#d9ead6]">
                            <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]"><CardTitle className="text-sm font-bold text-[#3d5a36]">Assigned Tasks</CardTitle></CardHeader>
                            <CardContent className="p-0 max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-[#f3faf2] sticky top-0">
                                        <TableRow>
                                            <TableHead className="w-1/2">Task Name</TableHead>
                                            <TableHead className="w-1/4">Due Date</TableHead>
                                            <TableHead className="w-1/4">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.activityReport.assignedTasks.map((t: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-semibold text-[#3d5a36]">{t.task_name}</TableCell>
                                                <TableCell className="text-xs text-gray-500">{t.due_date}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${t.status === 'On-Time' ? 'bg-green-100 text-green-800' : t.status === 'Late Finish' ? 'bg-emerald-100 text-emerald-800' : t.status === 'Active Delay' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                                        {t.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* E. Worker Responses Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <Card className="bg-white border-[#d9ead6]">
                            <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]"><CardTitle className="text-sm font-bold text-[#3d5a36]">Worker Responses Summary</CardTitle></CardHeader>
                            <CardContent className="p-4 grid grid-cols-4 gap-2 text-center">
                                <div className="p-2 flex flex-col items-center justify-start"><p className="text-xs font-bold text-green-700">DONE</p><p className="text-xl font-bold">{data.activityReport.workerResponses?.done || 0}</p></div>
                                <div className="p-2 flex flex-col items-center justify-start">
                                    <p className="text-xs font-bold text-blue-700">HELP</p>
                                    <p className="text-xl font-bold">{data.activityReport.workerResponses?.helpCount || 0}</p>
                                    {data.activityReport.workerResponses?.helpTypes?.length > 0 && (
                                        <div className="mt-1 w-full text-left">
                                            {data.activityReport.workerResponses.helpTypes.map((h: any, i: number) => (
                                                <p key={i} className="text-[10px] text-blue-900 border-t border-blue-100 pt-1 flex justify-between">
                                                    <span>{h.type}</span><span className="font-bold">{h.count}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 flex flex-col items-center justify-start">
                                    <p className="text-xs font-bold text-red-700">PEST</p>
                                    <p className="text-xl font-bold">{data.activityReport.workerResponses?.pest || 0}</p>
                                    {data.activityReport.workerResponses?.pestTypes?.length > 0 && (
                                        <div className="mt-1 w-full text-left">
                                            {data.activityReport.workerResponses.pestTypes.map((h: any, i: number) => (
                                                <p key={i} className="text-[10px] text-red-900 border-t border-red-100 pt-1 flex justify-between">
                                                    <span>{h.type}</span><span className="font-bold">{h.count}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 flex flex-col items-center justify-start">
                                    <p className="text-xs font-bold text-amber-700">DELAY</p>
                                    <p className="text-xl font-bold">{data.activityReport.workerResponses?.delay || 0}</p>
                                    {data.activityReport.workerResponses?.delayTypes?.length > 0 && (
                                        <div className="mt-1 w-full text-left">
                                            {data.activityReport.workerResponses.delayTypes.map((h: any, i: number) => (
                                                <p key={i} className="text-[10px] text-amber-900 border-t border-amber-100 pt-1 flex justify-between">
                                                    <span>{h.type}</span><span className="font-bold">{h.count}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* F. Response Tracking (Timeline) */}
                    {data.activityReport.timeline && data.activityReport.timeline.length > 0 && (
                        <Card className="bg-white border-[#d9ead6]">
                            <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]"><CardTitle className="text-sm font-bold text-[#3d5a36]">Worker Response Tracking</CardTitle></CardHeader>
                            <CardContent className="p-0 max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-[#f3faf2] sticky top-0">
                                        <TableRow>
                                            <TableHead className="w-1/3">Timestamp</TableHead>
                                            <TableHead className="w-1/3">Worker</TableHead>
                                            <TableHead className="w-1/3">Response Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.activityReport.timeline.map((t: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-xs text-gray-500">{fmtDate(t.timestamp)}</TableCell>
                                                <TableCell className="font-semibold text-[#3d5a36]">{t.workerName || "Unknown"}</TableCell>
                                                <TableCell className="text-xs font-bold bg-gray-50 rounded-md px-2 py-1 inline-block mt-2 ml-4">{t.action || "Pending"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* G. System Alerts */}
                    {(data.activityReport.systemAlerts?.missedTasks?.length > 0 || data.activityReport.systemAlerts?.failedSMS?.length > 0 || data.activityReport.systemAlerts?.unresponsive?.length > 0) && (
                        <Card className="border border-red-200 bg-red-50 shadow-sm">
                            <CardHeader className="py-3 px-4 border-b border-red-200"><CardTitle className="text-sm font-bold text-red-800 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Active System Alerts</CardTitle></CardHeader>
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.activityReport.systemAlerts?.unresponsive?.length > 0 && <div><h4 className="font-bold text-xs text-red-700 mb-1">Unresponsive Workers</h4><ul className="text-sm text-red-900 list-disc pl-4">{data.activityReport.systemAlerts.unresponsive.map((u:any, i:number)=><li key={i}>{u}</li>)}</ul></div>}
                                {data.activityReport.systemAlerts?.missedTasks?.length > 0 && <div><h4 className="font-bold text-xs text-red-700 mb-1">Missed Deadlines</h4><ul className="text-sm text-red-900 list-disc pl-4">{data.activityReport.systemAlerts.missedTasks.slice(0,5).map((t:any, i:number)=><li key={i}>{t.task}</li>)}</ul></div>}
                                {data.activityReport.systemAlerts?.failedSMS?.length > 0 && <div><h4 className="font-bold text-xs text-red-700 mb-1">SMS Routing Failures</h4><ul className="text-sm text-red-900 list-disc pl-4">{data.activityReport.systemAlerts.failedSMS.slice(0,5).map((f:any, i:number)=><li key={i}>{f.phone_number}</li>)}</ul></div>}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* 2. ANALYTICAL REPORT */}
            {reportType === 'analytical' && data?.analyticalReport && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#3d5a36] border-b border-[#d9ead6] pb-2">Analytical / Summary Report</h2>
                    
                    {/* A. Core Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-white"><CardContent className="p-6 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Task Completion Rate</p><p className="text-3xl font-black text-[#5d8044]">{data.analyticalReport.systemEffectiveness?.taskCompletionRate || 0}%</p></CardContent></Card>
                        <Card className="bg-white"><CardContent className="p-6 text-center"><p className="text-xs font-bold text-gray-500 uppercase">Worker Responsiveness</p><p className="text-3xl font-black text-blue-600">{data.analyticalReport.systemEffectiveness?.workerResponsivenessRate || 0}%</p></CardContent></Card>
                        <Card className="bg-white"><CardContent className="p-6 text-center">
                            <p className="text-xs font-bold text-gray-500 uppercase">SMS Delivery Success</p>
                            <p className="text-3xl font-black text-green-600">{data.analyticalReport.systemEffectiveness?.smsDeliverySuccessRate || 0}%</p>
                            <div className="flex justify-center gap-4 mt-2">
                                <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 rounded-md">Sent: {data.analyticalReport.systemEffectiveness?.smsDelivery?.sent || 0}</span>
                                <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 rounded-md">Failed: {data.analyticalReport.systemEffectiveness?.smsDelivery?.failed || 0}</span>
                            </div>
                        </CardContent></Card>
                    </div>

                    {/* B. Frequency Analysis */}
                    {data.analyticalReport.frequencyAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-white border-blue-200">
                                <CardHeader className="bg-blue-50 border-b border-blue-100 py-3"><CardTitle className="text-xs font-bold text-blue-900 uppercase">HELP Requests</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-1">
                                        {data.analyticalReport.frequencyAnalysis.help?.map((h:any, i:number) => (
                                            <li key={i} className="flex justify-between text-sm text-gray-700"><span>{h.category}</span><span className="font-bold">{h.count}</span></li>
                                        ))}
                                        {(!data.analyticalReport.frequencyAnalysis.help || data.analyticalReport.frequencyAnalysis.help.length === 0) && <li className="text-sm text-gray-400 italic">No help requests recorded.</li>}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-amber-200">
                                <CardHeader className="bg-amber-50 border-b border-amber-100 py-3"><CardTitle className="text-xs font-bold text-amber-900 uppercase">DELAY Cases</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-1">
                                        {data.analyticalReport.frequencyAnalysis.delay?.map((d:any, i:number) => (
                                            <li key={i} className="flex justify-between text-sm text-gray-700"><span>{d.category}</span><span className="font-bold">{d.count}</span></li>
                                        ))}
                                        {(!data.analyticalReport.frequencyAnalysis.delay || data.analyticalReport.frequencyAnalysis.delay.length === 0) && <li className="text-sm text-gray-400 italic">No delay reports recorded.</li>}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-red-200">
                                <CardHeader className="bg-red-50 border-b border-red-100 py-3"><CardTitle className="text-xs font-bold text-red-900 uppercase">PEST Reports</CardTitle></CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-1">
                                        {data.analyticalReport.frequencyAnalysis.pest?.map((p:any, i:number) => (
                                            <li key={i} className="flex justify-between text-sm text-gray-700"><span>{p.category}</span><span className="font-bold">{p.count}</span></li>
                                        ))}
                                        {(!data.analyticalReport.frequencyAnalysis.pest || data.analyticalReport.frequencyAnalysis.pest.length === 0) && <li className="text-sm text-gray-400 italic">No pest reports recorded.</li>}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* C. Crop Lifecycle */}
                    <Card className="bg-white border-[#d9ead6]">
                        <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]"><CardTitle className="text-sm font-bold text-[#3d5a36]">Crop Lifecycle Performance</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-[#f3faf2]">
                                    <TableRow>
                                        <TableHead>Crop Stage</TableHead>
                                        <TableHead>Tasks Done</TableHead>
                                        <TableHead>Tasks Delayed / Pending</TableHead>
                                        <TableHead>Pest Occurrences</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.analyticalReport.cropLifecycle && Object.entries(data.analyticalReport.cropLifecycle).map(([stage, metrics]: any) => (
                                        <TableRow key={stage}>
                                            <TableCell className="font-medium text-gray-700">{stage}</TableCell>
                                            <TableCell className="text-green-700 font-bold">{metrics.done}</TableCell>
                                            <TableCell className="text-amber-700 font-bold">{metrics.delay}</TableCell>
                                            <TableCell className="text-red-700 font-bold">{metrics.pest || 0}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* D. Operational Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-white border-[#d9ead6]">
                            <CardHeader className="bg-blue-50 border-b border-blue-100"><CardTitle className="text-sm font-bold text-blue-900">Most Affected Farming Activities</CardTitle></CardHeader>
                            <CardContent className="p-4">
                                <ul className="space-y-2">
                                    {data.analyticalReport.operationalInsights?.affectedActivities?.map((a:any, i:number) => (
                                        <li key={i} className="flex justify-between items-center text-sm border-b pb-1">
                                            <span className="font-medium text-gray-700">{a.activity}</span>
                                            <span className="text-amber-600 font-bold bg-amber-50 px-2 rounded-full">{a.delays} delays</span>
                                        </li>
                                    ))}
                                    {(!data.analyticalReport.operationalInsights?.affectedActivities || data.analyticalReport.operationalInsights.affectedActivities.length === 0) && <p className="text-sm text-gray-500 italic">No operational delays detected.</p>}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-red-200">
                            <CardHeader className="bg-red-50 border-b border-red-200"><CardTitle className="text-sm font-bold text-red-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Risk Indicators</CardTitle></CardHeader>
                            <CardContent className="p-4">
                                <ul className="list-disc pl-5 space-y-1 text-sm text-red-800">
                                    {data.analyticalReport.operationalInsights?.riskIndicators?.map((r:string, i:number) => <li key={i} className="font-bold">{r}</li>)}
                                    {(!data.analyticalReport.operationalInsights?.riskIndicators || data.analyticalReport.operationalInsights.riskIndicators.length === 0) && <li className="text-green-600 font-bold list-none">No immediate risks detected.</li>}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* E. Ranking */}
                    <Card className="bg-white border-[#d9ead6]">
                        <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]">
                            <div className="flex flex-col">
                                <CardTitle className="text-sm font-bold text-[#3d5a36] flex items-center gap-2 mb-1"><Users className="h-4 w-4"/> Worker Performance Ranking</CardTitle>
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Basis: Responsiveness rate, unresponsive incidents, delay frequency, and completion timeliness.</p>
                                <p className="text-xs text-gray-600 mt-1"><span className="font-bold text-green-700">Higher rank:</span> Responsive, timely, consistent. <span className="font-bold text-red-700">Lower rank:</span> Delayed, inactive, inconsistent.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-[#f3faf2]">
                                    <TableRow><TableHead>Rank</TableHead><TableHead>Worker</TableHead><TableHead>Responsiveness</TableHead><TableHead>Unresponsive Incidents</TableHead><TableHead>DONE</TableHead><TableHead>DELAY</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.analyticalReport.workerRankings?.map((w: any, idx: number) => (
                                        <TableRow key={w.id}>
                                            <TableCell className="font-bold text-gray-500">#{idx + 1}</TableCell>
                                            <TableCell className="font-bold">{w.name}</TableCell>
                                            <TableCell>{w.responsiveness}%</TableCell>
                                            <TableCell className="text-red-600 font-bold">{w.unresponsiveIncidents}</TableCell>
                                            <TableCell className="text-green-700">{w.done}</TableCell>
                                            <TableCell className="text-amber-700">{w.delay}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* 3. EXPORT REPORT */}
            {reportType === 'export' && data?.exportReport && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-[#3d5a36] border-b border-[#d9ead6] pb-2">Individual Worker & Batch Export</h2>
                    
                    {/* B. Profiles & Context */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.exportReport.profiles?.batchDetails && (
                            <Card className="border-l-4 border-amber-500 bg-white">
                                <CardContent className="p-4"><p className="text-xs font-bold text-amber-700 uppercase">Batch Assignment Context</p><p className="font-black text-lg text-gray-800">{data.exportReport.profiles.batchDetails.name} <span className="text-sm font-normal text-gray-500">({data.exportReport.profiles.batchDetails.cropType})</span></p><p className="text-sm text-gray-600">Total Workers Assigned: <b>{data.exportReport.profiles.batchDetails.totalWorkers}</b></p></CardContent>
                            </Card>
                        )}
                        {workerId && (
                            <Card className="border-l-4 border-blue-500 bg-white">
                                <CardContent className="p-4"><p className="text-xs font-bold text-blue-700 uppercase">Target Worker Context</p><p className="font-black text-lg text-gray-800">{data.filterOptions?.workersMap?.[workerId]}</p><p className="text-sm text-gray-600">Performance isolated to this worker.</p></CardContent>
                            </Card>
                        )}
                    </div>

                    {/* C. Aggregated Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <StatCard title="Overall Responsiveness Rate" value={`${data.exportReport.aggregated?.responsiveness || 0}%`} icon={<MessageSquare className="h-5 w-5" />} color="border-l-blue-500" textColor="text-blue-700" />
                    </div>

                    {/* D. Task Performance Breakdown */}
                    <h3 className="text-lg font-bold text-gray-700 mt-6 border-b pb-1">Task Performance Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Completed On-Time" value={data.exportReport.taskPerformance?.onTime || 0} icon={<CheckCircle className="h-5 w-5" />} color="border-l-green-500" textColor="text-green-700" />
                        <StatCard title="Completed Delayed" value={data.exportReport.taskPerformance?.delayedDone || 0} icon={<Clock className="h-5 w-5" />} color="border-l-emerald-600" textColor="text-emerald-700" />
                        <StatCard title="Active Delays" value={data.exportReport.taskPerformance?.activeDelays || 0} icon={<AlertTriangle className="h-5 w-5" />} color="border-l-amber-500" textColor="text-amber-700" />
                        <StatCard title="Missed / Unresponsive" value={data.exportReport.taskPerformance?.unresponsive || 0} icon={<AlertCircle className="h-5 w-5" />} color="border-l-red-600" textColor="text-red-800" />
                    </div>

                    {/* F. Timeline Performance Matrix */}
                    <Card className="bg-white border-[#d9ead6]">
                        <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]"><CardTitle className="text-sm font-bold text-[#3d5a36]">Timeline Performance Matrix (Interactions per Crop Stage)</CardTitle></CardHeader>
                        <CardContent className="p-4 flex flex-wrap gap-4 justify-between">
                            {data.exportReport.timelineMatrix && Object.entries(data.exportReport.timelineMatrix).map(([stage, count]: any) => (
                                <div key={stage} className="flex-1 text-center bg-gray-50 border rounded-lg p-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase">{stage}</p>
                                    <p className="text-xl font-black text-[#5d8044]">{count}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* E. Interaction Logs with Latency */}
                    <Card className="bg-white border-[#d9ead6]">
                        <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0]"><CardTitle className="text-sm font-bold text-[#3d5a36]">Chronological Interaction Logs</CardTitle></CardHeader>
                        <CardContent className="p-0 max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-[#f3faf2] sticky top-0">
                                    <TableRow><TableHead>Timestamp</TableHead><TableHead>Worker</TableHead><TableHead>Task Assigned</TableHead><TableHead>Worker Reply</TableHead><TableHead>Response Latency</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.exportReport.logs?.map((l: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs text-gray-500 whitespace-nowrap">{fmtDate(l.created_at)}</TableCell>
                                            <TableCell className="font-bold">{l.workerName}</TableCell>
                                            <TableCell className="text-gray-600">{l.taskName}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.response_text==='DONE'?'bg-green-100 text-green-800' : l.response_text?.includes('DELAY')?'bg-amber-100 text-amber-800' : l.response_text?.includes('HELP')?'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                                                    {l.response_text}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-purple-700 font-bold">{l.latency}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: any) {
  return (
    <Card className={`border-l-4 ${color} bg-white shadow-sm`}>
      <CardContent className="p-4 flex justify-between items-center gap-2">
        <div><p className="text-xs font-bold text-gray-500 uppercase leading-tight mb-1">{title}</p><p className={`text-2xl font-black ${textColor}`}>{value}</p></div>
        <div className={`p-2 rounded-xl bg-opacity-10 ${textColor.replace('text', 'bg')}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}
