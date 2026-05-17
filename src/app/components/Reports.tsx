import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import {
  FileText, Download, TrendingUp, Users, MessageSquare,
  RefreshCw, AlertCircle, Bug, Clock, CheckCircle, ChevronRight, Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = "http://localhost/anialerto-backend/src/get_reports_data.php";

const GREEN  = [93, 128, 68]  as [number, number, number];
const LGREEN = [229, 245, 220] as [number, number, number];
const DGRAY  = [55,  65,  81]  as [number, number, number];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}
function nowLabel() {
  return new Date().toLocaleString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// ── PDF builder ───────────────────────────────────────────────────────────────

function buildPDF(data: any, reportType: "messages" | "workers", dateFilter?: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 15;

  const section = (title: string, tagalog: string) => {
    y += 4;
    doc.setFillColor(...LGREEN);
    doc.rect(10, y, W - 20, 8, "F");
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.text(`${title}  /  ${tagalog}`, 13, y + 5.5);
    doc.setTextColor(...DGRAY);
    y += 10;
  };

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("AniAlerto Farm Management System", W / 2, 11, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const title = dateFilter
    ? `Daily Detail Report — ${fmtDate(dateFilter)}`
    : reportType === "messages"
    ? "SMS Activity Report / Ulat ng Aktibidad sa SMS"
    : "Worker Engagement Report / Ulat ng Pakikilahok ng Manggagawa";
  doc.text(title, W / 2, 19, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Generated: ${nowLabel()}`, W / 2, 25, { align: "center" });
  doc.setTextColor(...DGRAY);
  y = 35;

  const s = data.summary;

  if (!dateFilter) {
    // ── Summary stats ──────────────────────────────────────────────────────
    section("Summary Statistics", "Buod ng Istatistika");
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Metric / Sukatan", "Value / Halaga"]],
      body: [
        ["Total Messages / Kabuuang Mensahe",           String(s.total)],
        ["Completion Rate / Tapusin na Rate",           `${s.completionRate}%`],
        ["Active Workers / Aktibong Manggagawa",        String(s.activeWorkers)],
        ["DONE Replies / Tapos na",                     String(s.completed)],
        ["DELAY Replies / Naantala",                    String(s.delayed)],
        ["HELP Requests / Hiling ng Tulong",            String(s.helpRequests)],
        ["PEST Reports / Ulat ng Peste",                String(s.pestReports)],
        ["Pending (no reply) / Walang Sagot",           String(s.pending)],
      ],
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 253, 243] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // ── Response distribution ─────────────────────────────────────────────
    section("Response Distribution", "Distribusyon ng Sagot");
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Response / Sagot", "Count / Bilang", "Percent / Porsyento"]],
      body: (data.statusDistribution || []).map((r: any) => [r.name, String(r.value), `${r.percent}%`]),
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 253, 243] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Daily volume (or filtered day) ────────────────────────────────────────
  section("Daily Message Volume", "Dami ng Mensahe Araw-araw");
  const volRows = dateFilter
    ? (data.dailyVolume || []).filter((r: any) => r.date === dateFilter)
    : (data.dailyVolume || []);
  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    head: [["Date / Petsa", "Messages Sent / Mensaheng Ipinadala"]],
    body: volRows.map((r: any) => [fmtDate(r.date), String(r.count)]),
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 253, 243] },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── Worker engagement ──────────────────────────────────────────────────────
  if (reportType === "workers" || dateFilter) {
    section("Worker Engagement", "Pakikilahok ng Manggagawa");
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Worker / Manggagawa", "Phone", "Sent", "DONE", "DELAY", "HELP", "PEST", "Pending"]],
      body: (data.workerEngagement || []).map((w: any) => [
        w.name, w.phone,
        String(w.total_sent), String(w.done_count), String(w.delay_count),
        String(w.help_count), String(w.pest_count), String(w.pending_count),
      ]),
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 253, 243] },
      columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 32 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Pest alerts ────────────────────────────────────────────────────────────
  if (!dateFilter && data.pestAlerts?.length > 0) {
    section("Pest Incident Log", "Talaan ng Insidente ng Peste");
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Reported At / Petsa", "Worker / Manggagawa", "Phone", "Batch / Pangkat", "Status"]],
      body: (data.pestAlerts || []).map((p: any) => [
        p.reported_at ? new Date(p.reported_at).toLocaleString("en-PH") : "-",
        p.worker_name || "-", p.phone || "-",
        p.batch_name  || "—", p.status || "-",
      ]),
      headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("AniAlerto — Confidential Farm Management Report", W / 2, pageH - 8, { align: "center" });
  doc.text(`Page 1  |  Generated ${nowLabel()}`, W / 2, pageH - 4, { align: "center" });

  const fname = dateFilter
    ? `AniAlerto_Daily_${dateFilter}.pdf`
    : `AniAlerto_${reportType === "messages" ? "SMS" : "Workers"}_Report_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fname);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Reports() {
  const [reportType, setReportType] = useState<"messages" | "workers">("messages");
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dateFrom, setDateFrom]     = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load reports data.");
      setData({ summary: { total: 0, completionRate: 0, activeWorkers: 0, helpRequests: 0, delayed: 0, pestReports: 0, pending: 0, completed: 0 }, dailyVolume: [], statusDistribution: [], workerEngagement: [], pestAlerts: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleGeneratePDF = async () => {
    if (!data) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 100)); // let spinner render
    try { buildPDF(data, reportType); }
    catch (e) { console.error("PDF error:", e); }
    finally { setGenerating(false); }
  };

  const handleDailyReport = async (date: string) => {
    if (!data) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 100));
    try { buildPDF(data, reportType, date); }
    catch (e) { console.error("PDF error:", e); }
    finally { setGenerating(false); }
  };

  // Filter daily volume to selected date range
  const filteredVolume = (data?.dailyVolume || []).filter((r: any) =>
    r.date >= dateFrom && r.date <= dateTo
  );

  const s = data?.summary || {};

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96">
      <RefreshCw className="h-10 w-10 animate-spin text-[#8acb88] mb-4" />
      <p className="text-gray-500 animate-pulse">Loading report data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Reports & Logs</h1>
          <p className="text-[#556d4a]">Database-driven insights from your SMS activity</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button className="bg-[#5d8044] hover:bg-[#4a6b36] text-white border border-[#7a9b5c]" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </motion.div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}. Please check if XAMPP is running.</p>
        </div>
      )}

      {/* Summary Cards */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <StatCard title="Total Messages"   value={s.total      || 0} icon={<MessageSquare className="h-5 w-5"/>} color="border-l-[#5d8044]" textColor="text-[#3d5a36]"/>
        <StatCard title="Completion Rate"  value={`${s.completionRate || 0}%`} icon={<TrendingUp className="h-5 w-5"/>} color="border-l-[#5d8044]" textColor="text-[#5d8044]"/>
        <StatCard title="Active Workers"   value={s.activeWorkers || 0} icon={<Users className="h-5 w-5"/>} color="border-l-[#5d8044]" textColor="text-[#3d5a36]"/>
        <StatCard title="Help Requests"    value={s.helpRequests  || 0} icon={<FileText className="h-5 w-5"/>} color="border-l-[#d97706]" textColor="text-orange-600"/>
        <StatCard title="DONE Replies"     value={s.completed     || 0} icon={<CheckCircle className="h-5 w-5"/>} color="border-l-green-500" textColor="text-green-700"/>
        <StatCard title="Delay Replies"    value={s.delayed       || 0} icon={<Clock className="h-5 w-5"/>} color="border-l-yellow-500" textColor="text-yellow-700"/>
        <StatCard title="PEST Reports"     value={s.pestReports   || 0} icon={<Bug className="h-5 w-5"/>} color="border-l-red-500" textColor="text-red-700"/>
        <StatCard title="Pending (no reply)" value={s.pending     || 0} icon={<AlertCircle className="h-5 w-5"/>} color="border-l-gray-400" textColor="text-gray-500"/>
      </motion.div>

      {/* PDF Generator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
        <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
            <CardTitle className="text-[#3d5a36] flex items-center gap-2">
              <Download className="h-5 w-5 text-[#5d8044]" /> Generate PDF Report
            </CardTitle>
            <CardDescription className="text-[#556d4a]">
              Produces a clean, structured PDF — not a page screenshot
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[#3d5a36] font-semibold">Report Type</Label>
                <select className="w-full rounded-xl border border-[#d9ead6] bg-white px-3 py-2.5 text-sm shadow-sm"
                  value={reportType} onChange={e => setReportType(e.target.value as any)}>
                  <option value="messages">SMS Activity Report</option>
                  <option value="workers">Worker Engagement Report</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#3d5a36] font-semibold">From</Label>
                <input type="date" className="w-full rounded-xl border border-[#d9ead6] bg-white px-3 py-2.5 text-sm shadow-sm"
                  value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#3d5a36] font-semibold">To</Label>
                <input type="date" className="w-full rounded-xl border border-[#d9ead6] bg-white px-3 py-2.5 text-sm shadow-sm"
                  value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>

            {/* What's included info */}
            <div className="rounded-xl bg-[#f0f9eb] border border-[#d9ead6] p-4 text-xs text-[#556d4a] space-y-1">
              <p className="font-semibold text-[#3d5a36] mb-1">📄 PDF will include:</p>
              <p>• Summary statistics (English + Tagalog labels)</p>
              <p>• Response distribution (DONE / DELAY / HELP / PEST / Pending)</p>
              <p>• Daily message volume table</p>
              {reportType === "workers" && <p>• Per-worker engagement breakdown</p>}
              <p>• Pest incident log</p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]"
                onClick={handleGeneratePDF}
                disabled={generating || !data}
              >
                {generating
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating PDF...</>
                  : <><Download className="h-4 w-4 mr-2" />Generate PDF Report</>
                }
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Daily Volume — clickable rows */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
        <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
          <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
            <CardTitle className="text-[#3d5a36]">Daily Message Volume</CardTitle>
            <CardDescription className="text-[#556d4a]">
              Click any row to generate a detailed PDF report for that day
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#f3faf2]">
                <TableRow>
                  <TableHead>Date / Petsa</TableHead>
                  <TableHead>Messages Sent / Mensahe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVolume.length > 0 ? filteredVolume.map((row: any, i: number) => (
                  <motion.tr
                    key={row.date}
                    className="hover:bg-[#eff7ed] cursor-pointer transition-colors duration-150 group"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    onClick={() => handleDailyReport(row.date)}
                    title={`Click to download daily report for ${fmtDate(row.date)}`}
                  >
                    <TableCell className="font-medium text-[#3d5a36]">{fmtDate(row.date)}</TableCell>
                    <TableCell className="text-[#556d4a]">{row.count} message{row.count !== 1 ? "s" : ""}</TableCell>
                    <TableCell>
                      <Badge className="bg-[#e4fde1] text-[#5d8044] border-[#d9ead6]">Synced</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-[#5d8044] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        <Download className="h-3.5 w-3.5" /> Daily PDF <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </TableCell>
                  </motion.tr>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-400">
                      No data found for this date range.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Worker Engagement Table */}
      {data?.workerEngagement?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
            <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
              <CardTitle className="text-[#3d5a36]">Worker Engagement</CardTitle>
              <CardDescription className="text-[#556d4a]">Response breakdown per worker</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>DONE</TableHead>
                    <TableHead>DELAY</TableHead>
                    <TableHead>HELP</TableHead>
                    <TableHead>PEST</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workerEngagement.map((w: any, i: number) => (
                    <motion.tr key={i} className="hover:bg-[#eff7ed]"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <TableCell>
                        <p className="font-medium text-[#3d5a36]">{w.name}</p>
                        <p className="text-xs text-[#7b8f6f] font-mono">{w.phone}</p>
                      </TableCell>
                      <TableCell className="font-semibold text-[#3d5a36]">{w.total_sent}</TableCell>
                      <TableCell><Badge className="bg-green-50 text-green-700 border-green-200">{w.done_count}</Badge></TableCell>
                      <TableCell><Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">{w.delay_count}</Badge></TableCell>
                      <TableCell><Badge className="bg-orange-50 text-orange-700 border-orange-200">{w.help_count}</Badge></TableCell>
                      <TableCell><Badge className="bg-red-50 text-red-700 border-red-200">{w.pest_count}</Badge></TableCell>
                      <TableCell><Badge variant="outline" className="text-gray-500">{w.pending_count}</Badge></TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* PDF generation overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#5d8044]" />
            <p className="text-[#3d5a36] font-semibold">Building your PDF report...</p>
            <p className="text-xs text-gray-400">Download will start automatically</p>
          </div>
        </div>
      )}
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
