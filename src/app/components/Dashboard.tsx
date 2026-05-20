import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Layers, Users, CheckCircle, Bell, Loader2, Send, AlertCircle, X, MessageSquare } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { CropCalendar } from "./CropCalendar";

interface Alert {
  id: number; type: string; worker_id: number | null; worker_name: string | null;
  phone: string | null; task_id: number | null; message: string | null;
  done_reply: string | null; is_read: number; created_at: string;
}
interface DashboardProps {
  alerts: Alert[];
  onAlertsRead?: (newCount?: number) => void;
}

export function Dashboard({ alerts: propAlerts, onAlertsRead }: DashboardProps) {
  const [dbStats,          setDbStats]          = useState<any>(null);
  const [loading,          setLoading]          = useState(true);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [schedulerResult,  setSchedulerResult]  = useState<{ type: "success"|"error"; message: string; details?: string[] }|null>(null);
  const [localAlerts,      setLocalAlerts]      = useState<Alert[]>(propAlerts);

  // Sync prop alerts into local state
  useEffect(() => { setLocalAlerts(propAlerts); }, [propAlerts]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch("http://localhost/anialerto-backend/src/dashboard_stats.php");
      setDbStats(await r.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const r = await fetch("http://localhost/anialerto-backend/src/get_alerts.php");
      const d = await r.json();
      if (d.alerts) setLocalAlerts(d.alerts);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
    // Auto-refresh alerts every 10 s
    const alertTimer = setInterval(fetchAlerts, 10_000);

    return () => { clearInterval(alertTimer); };
  }, [fetchStats, fetchAlerts]);

  // Mark HELP/PEST alert as resolved → remove from checklist + update bell instantly
  const markAlertRead = async (id: number) => {
    setLocalAlerts(prev => prev.filter(a => a.id !== id));  // optimistic
    try {
      const res  = await fetch("http://localhost/anialerto-backend/src/get_alerts.php", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id }),
      });
      const data = await res.json();
      onAlertsRead?.(data.unread_count);
    } catch (e) { console.error(e); }
  };

  // Bulk-clear all old alerts (one-click dismiss stale test data)
  const clearAllAlerts = async () => {
    setLocalAlerts([]);
    try {
      await fetch("http://localhost/anialerto-backend/src/get_alerts.php", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mark_all: true }),
      });
      onAlertsRead?.(0);
    } catch (e) { console.error(e); }
  };

  const handleRunScheduler = async () => {
    setSchedulerRunning(true); setSchedulerResult(null);
    try {
      const res  = await fetch("http://localhost/anialerto-backend/src/run_scheduler.php", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setSchedulerResult({ type: "success", message: data.message, details: data.data?.details || [] });
        fetchStats();
      } else {
        setSchedulerResult({ type: "error", message: data.message || "Scheduler failed" });
      }
    } catch {
      setSchedulerResult({ type: "error", message: "Cannot connect to backend. Is XAMPP running?" });
    } finally {
      setSchedulerRunning(false);
      setTimeout(() => setSchedulerResult(null), 10_000);
    }
  };

  const stats = dbStats ? {
    batches:          dbStats.counts.batches,
    workers:          dbStats.counts.workers,
    messages_today:   dbStats.counts.messages_today,
    completion_rate:  dbStats.counts.completion_rate,
  } : { batches: 0, workers: 0, messages_today: 0, completion_rate: 0 };

  // API already returns only is_read=0 items — show everything returned
  const activeAlerts = localAlerts;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">AniAlerto Dashboard</h1>
          <p className="text-[#556d4a]">Live overview from system database</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleRunScheduler} disabled={schedulerRunning}
              className="bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg border border-[#7a9b5c]">
              {schedulerRunning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Running...</> : <><Send className="h-4 w-4 mr-2"/>Run Scheduler</>}
            </Button>
          </motion.div>
          <motion.div className="bg-[#5d8044]/10 text-[#5d8044] px-4 py-2 rounded-full text-sm font-medium border border-[#5d8044]/20"
            whileHover={{ scale: 1.05 }}>
            Live System Connected
          </motion.div>
        </div>
      </motion.div>

      {/* Scheduler result */}
      <AnimatePresence>
        {schedulerResult && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }} transition={{ duration: 0.3 }}>
            <Card className={`rounded-[1rem] border shadow-md ${schedulerResult.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {schedulerResult.type === "success" ? <CheckCircle className="h-5 w-5 text-green-600 mt-0.5"/> : <AlertCircle className="h-5 w-5 text-red-600 mt-0.5"/>}
                    <div>
                      <p className={`font-medium text-sm ${schedulerResult.type === "success" ? "text-green-800" : "text-red-800"}`}>{schedulerResult.message}</p>
                      {schedulerResult.details && schedulerResult.details.length > 0 && (
                        <ul className="mt-1 space-y-0.5">{schedulerResult.details.map((d, i) => <li key={i} className="text-xs text-green-700">• {d}</li>)}</ul>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSchedulerResult(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4"/></button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHECKLIST: Agricultural Advisories ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
            <CardTitle className="text-lg flex items-center gap-2 text-[#3d5a36]">
              <Bell className="h-5 w-5 text-[#5d8044]"/>
              Agricultural Advisories Checklist
              {activeAlerts.length > 0 && (
                <span className="ml-2 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">{activeAlerts.length} active</span>
              )}
              {activeAlerts.length > 0 && (
                <button
                  onClick={clearAllAlerts}
                  title="Dismiss all old notifications"
                  className="ml-auto text-xs text-[#7b8f6f] hover:text-red-500 border border-[#d9ead6] hover:border-red-300 rounded-full px-3 py-0.5 transition-colors"
                >
                  Clear All
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <AnimatePresence mode="popLayout">
              {activeAlerts.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-8 text-[#7b8f6f] gap-2">
                  <CheckCircle className="h-10 w-10 text-[#5d8044] opacity-50"/>
                  <p className="font-medium">All caught up! / Wala nang alerto.</p>
                  <p className="text-xs">No unread agricultural advisories.</p>
                </motion.div>
              ) : (
                activeAlerts.map((alert, index) => {
                  // Split bilingual message at blank line (EN \n\n TL)
                  const parts = (alert.message ?? '').split(/\n\n/);
                  const msgEN = parts[0]?.trim() ?? alert.message ?? '';
                  const msgTL = parts[1]?.trim() ?? '';

                  // ── DELAY: checkable, admin must manually dismiss ──
                  if (alert.type === 'DELAY') {
                    const hasDone = !!alert.done_reply;
                    return (
                      <motion.div key={alert.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className={`flex items-start gap-3 p-3 mb-2 rounded-[1rem] border transition-colors group ${
                          hasDone
                            ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                            : 'bg-amber-50 border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => markAlertRead(alert.id)}
                          title="Mark as handled / resolved"
                          className={`flex-shrink-0 mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                            hasDone
                              ? 'border-emerald-500 hover:bg-emerald-500'
                              : 'border-amber-500 hover:bg-amber-500'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 text-white transition-opacity"/>
                        </button>

                        {/* Dot */}
                        <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full mt-1.5 ${
                          hasDone ? 'bg-emerald-500' : 'bg-yellow-400'
                        }`}/>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold uppercase mr-2 ${
                            hasDone ? 'text-emerald-700' : 'text-yellow-700'
                          }`}>
                            {hasDone ? 'DELAY ✓ DONE' : 'DELAY'}
                          </span>
                          <span className="text-sm text-[#3d5a36]">{msgEN}</span>
                          {msgTL && <p className="text-xs text-[#7b8f6f] mt-0.5 italic">{msgTL}</p>}
                          {alert.worker_name && (
                            <p className="text-xs text-[#7b8f6f] mt-0.5">Worker: {alert.worker_name} · {alert.phone}</p>
                          )}
                          <p className={`text-[10px] mt-1 font-medium ${
                            hasDone ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {hasDone
                              ? 'Worker replied DONE — Check to mark as handled · I-check upang markahan bilang naayos'
                              : 'Admin must check to mark as handled · Kailangang i-check ng admin upang alisin'}
                          </p>
                        </div>

                        {/* Time + dismiss */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-[#556d4a] whitespace-nowrap">
                            {new Date(alert.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <button onClick={() => markAlertRead(alert.id)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              hasDone ? 'text-emerald-500 hover:text-emerald-700' : 'text-amber-500 hover:text-amber-700'
                            }`}
                            title="Dismiss">
                            <X className="h-3.5 w-3.5"/>
                          </button>
                        </div>
                      </motion.div>
                    );
                  }

                  // ── HELP / PEST: checkable items ──
                  return (
                    <motion.div key={alert.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      className="flex items-start gap-3 p-3 mb-2 rounded-[1rem] border bg-[#f8fdf3] border-[#e5ede0] hover:border-[#5d8044]/40 transition-colors group"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        title="Mark as handled / resolved"
                        className="flex-shrink-0 mt-0.5 h-5 w-5 rounded border-2 border-[#5d8044] flex items-center justify-center
                                   hover:bg-[#5d8044] hover:text-white transition-colors group-hover:border-[#3d5a36]"
                      >
                        <CheckCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 text-white transition-opacity"/>
                      </button>

                      {/* Dot */}
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500 mt-1.5"/>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase mr-2 text-red-600">{alert.type}</span>
                        <span className="text-sm text-[#3d5a36]">{msgEN}</span>
                        {msgTL && <p className="text-xs text-[#7b8f6f] mt-0.5 italic">{msgTL}</p>}
                        {alert.worker_name && (
                          <p className="text-xs text-[#7b8f6f] mt-0.5">Worker: {alert.worker_name} · {alert.phone}</p>
                        )}
                        <p className="text-[10px] text-[#5d8044] mt-1 font-medium">Check to mark as handled · I-check upang markahan bilang naayos</p>
                      </div>

                      {/* Time + dismiss */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#556d4a] whitespace-nowrap">
                          {new Date(alert.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button onClick={() => markAlertRead(alert.id)}
                          className="text-[#5d8044] hover:text-[#3d5a36] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Dismiss">
                          <X className="h-3.5 w-3.5"/>
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        {loading ? (
          <div className="col-span-full flex justify-center p-8"><Loader2 className="animate-spin text-[#5d8044] h-8 w-8"/></div>
        ) : (
          <>
            <StatCard title="Active Farm Batches"  value={stats.batches}           icon={<Layers/>}       color="border-l-[#5d8044]"  textColor="text-[#3d5a36]"/>
            <StatCard title="Registered Workers"   value={stats.workers}           icon={<Users/>}        color="border-l-[#5d8044]"  textColor="text-[#5d8044]"/>
            <StatCard title="Total Logs Today"     value={stats.messages_today}    icon={<MessageSquare/>} color="border-l-[#8acb88]" textColor="text-[#8acb88]"/>
            <StatCard title="Completion Rate"      value={`${stats.completion_rate}%`} icon={<CheckCircle/>} color="border-l-[#ffbf46]" textColor="text-[#ffbf46]"/>
          </>
        )}
      </motion.div>

      {/* ── FULL CROP CALENDAR ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>
        <CropCalendar />
      </motion.div>

      {/* Charts */}
      <motion.div className="grid lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
              <CardTitle className="text-[#3d5a36]">Message Activity (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !dbStats ? (
                <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin text-[#5d8044] h-8 w-8"/></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dbStats.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5ede0"/>
                    <XAxis dataKey="date" stroke="#556d4a"/>
                    <YAxis stroke="#556d4a"/>
                    <Tooltip contentStyle={{ backgroundColor: "#f8fdf3", border: "1px solid #d9ead6", borderRadius: "0.5rem" }}/>
                    <Line type="monotone" dataKey="count" stroke="#5d8044" strokeWidth={3} name="Total Logs"/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
              <CardTitle className="text-[#3d5a36]">Batch Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading || !dbStats ? (
                <div className="flex justify-center items-center h-[300px]"><Loader2 className="animate-spin text-[#5d8044] h-8 w-8"/></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={dbStats.batchStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {dbStats.batchStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color}/>
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#f8fdf3", border: "1px solid #d9ead6", borderRadius: "0.5rem" }}/>
                    <Legend/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: any) {
  return (
    <motion.div whileHover={{ y: -6, scale: 1.02 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className={`border-l-4 ${color} rounded-[1.5rem] bg-gradient-to-br from-white to-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20 border-[#d9ead6]`}>
        <CardContent className="p-6 flex justify-between items-center gap-4">
          <div>
            <p className="text-xs font-bold text-[#7b8f6f] uppercase">{title}</p>
            <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#eff7ec] text-[#5d8044] shadow-sm">{icon}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}