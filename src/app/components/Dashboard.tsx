import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Layers, Users, CheckCircle, Bell, Loader2, Send, AlertCircle, X, MessageSquare, Sprout, Calendar, ChevronRight } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface Alert {
  id: number; type: string; worker_id: number | null; worker_name: string | null;
  phone: string | null; task_id: number | null; message: string | null;
  is_read: number; created_at: string;
}
interface DashboardProps { alerts: Alert[]; onAlertsRead?: () => void; }

// ── Crop stage helper ─────────────────────────────────────────────────────────
function cropStage(day: number) {
  if (day < 0)   return { label: "Pre-Planting / Bago Magtanim",  color: "bg-gray-400",   text: "text-gray-600"   };
  if (day < 30)  return { label: "Seedling / Binhi",              color: "bg-green-400",  text: "text-green-700"  };
  if (day < 60)  return { label: "Vegetative / Paglaki",          color: "bg-lime-500",   text: "text-lime-700"   };
  if (day < 90)  return { label: "Reproductive / Pagbulaklak",    color: "bg-yellow-400", text: "text-yellow-700" };
  if (day < 120) return { label: "Maturity / Paghinog",           color: "bg-orange-400", text: "text-orange-700" };
  return           { label: "Harvest-Ready / Anihan",             color: "bg-red-400",    text: "text-red-700"    };
}

export function Dashboard({ alerts: propAlerts, onAlertsRead }: DashboardProps) {
  const [dbStats,          setDbStats]          = useState<any>(null);
  const [loading,          setLoading]          = useState(true);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [schedulerResult,  setSchedulerResult]  = useState<{ type: "success"|"error"; message: string; details?: string[] }|null>(null);
  const [localAlerts,      setLocalAlerts]      = useState<Alert[]>(propAlerts);
  const [calendarData,     setCalendarData]     = useState<any>(null);
  const [calLoading,       setCalLoading]       = useState(true);

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

  // Fetch crop calendar
  const fetchCalendar = useCallback(async () => {
    setCalLoading(true);
    try {
      const r = await fetch("http://localhost/anialerto-backend/src/crop_calendar.php");
      setCalendarData(await r.json());
    } catch (e) { console.error(e); }
    finally { setCalLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
    fetchCalendar();
    // Auto-refresh alerts every 30 s
    const alertTimer = setInterval(fetchAlerts, 30_000);
    // Auto-refresh calendar every 5 min
    const calTimer   = setInterval(fetchCalendar, 300_000);
    return () => { clearInterval(alertTimer); clearInterval(calTimer); };
  }, [fetchStats, fetchAlerts, fetchCalendar]);

  // Mark alert as read → animate out of list
  const markAlertRead = async (id: number) => {
    // Optimistic remove
    setLocalAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await fetch("http://localhost/anialerto-backend/src/get_alerts.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      onAlertsRead?.();
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

  const unread = localAlerts.filter(a => !a.is_read);

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
              {unread.length > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">{unread.length} new</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <AnimatePresence mode="popLayout">
              {unread.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-8 text-[#7b8f6f] gap-2">
                  <CheckCircle className="h-10 w-10 text-[#5d8044] opacity-50"/>
                  <p className="font-medium">All caught up! / Wala nang alerto.</p>
                  <p className="text-xs">No unread agricultural advisories.</p>
                </motion.div>
              ) : (
                unread.map((alert, index) => (
                  <motion.div key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 mb-2 rounded-[1rem] border bg-[#f8fdf3] border-[#e5ede0] hover:border-[#5d8044]/40 transition-colors group"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => markAlertRead(alert.id)}
                      title="Mark as acknowledged"
                      className="flex-shrink-0 h-5 w-5 rounded border-2 border-[#5d8044] flex items-center justify-center
                                 hover:bg-[#5d8044] hover:text-white transition-colors group-hover:border-[#3d5a36]"
                    >
                      <CheckCircle className="h-3 w-3 opacity-0 group-hover:opacity-100 text-white transition-opacity"/>
                    </button>

                    {/* Dot */}
                    <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                      ["PEST","HELP"].includes(alert.type) ? "bg-red-500" :
                      alert.type === "DELAY" ? "bg-yellow-400" : "bg-blue-400"
                    }`}/>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-bold uppercase mr-2 ${
                        ["PEST","HELP"].includes(alert.type) ? "text-red-600" : "text-yellow-600"
                      }`}>{alert.type}</span>
                      <span className="text-sm text-[#3d5a36]">{alert.message}</span>
                      {alert.worker_name && (
                        <p className="text-xs text-[#7b8f6f] mt-0.5">Worker: {alert.worker_name} · {alert.phone}</p>
                      )}
                    </div>

                    {/* Time + check button */}
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
                ))
              )}
            </AnimatePresence>
            {localAlerts.filter(a => a.is_read).length > 0 && (
              <p className="text-center text-xs text-[#7b8f6f] mt-2">
                {localAlerts.filter(a => a.is_read).length} acknowledged advisory(ies) hidden · auto-refreshes every 30s
              </p>
            )}
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

      {/* ── CROP CALENDAR MINI-WIDGET ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
            <CardTitle className="text-[#3d5a36] flex items-center gap-2">
              <Sprout className="h-5 w-5 text-[#5d8044]"/>
              Crop Calendar Overview
              <span className="ml-auto text-xs text-[#7b8f6f] font-normal flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5"/> Synced from Crop Calendar tab
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {calLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin text-[#5d8044] h-8 w-8"/>
              </div>
            ) : !calendarData?.timeline?.length ? (
              <p className="text-center text-[#7b8f6f] py-8 text-sm">No active batches found.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {calendarData.timeline.map((batch: any, i: number) => {
                  const stage     = cropStage(batch.current_day);
                  const pct       = Math.min(100, Math.max(0, batch.progress_percent));
                  const nextTask  = batch.sms_schedule?.find((s: any) => s.status === "upcoming" || s.status === "today");
                  const todayTask = batch.sms_schedule?.find((s: any) => s.status === "today");

                  return (
                    <motion.div key={batch.batch_id}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.06 }}
                      whileHover={{ y: -3 }}
                      className="rounded-[1.25rem] border border-[#d9ead6] bg-white shadow-md p-4 space-y-3"
                    >
                      {/* Batch name + status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#3d5a36] text-sm leading-tight">{batch.batch_name}</p>
                          <p className="text-xs text-[#7b8f6f]">{batch.location} · {batch.variety}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          batch.status === "Active"    ? "bg-green-100 text-green-700" :
                          batch.status === "Harvested" ? "bg-gray-100 text-gray-600"  : "bg-blue-100 text-blue-700"
                        }`}>{batch.status}</span>
                      </div>

                      {/* Stage badge */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${stage.color}`}>
                          <Sprout className="h-2.5 w-2.5"/> {stage.label.split("/")[0].trim()}
                        </span>
                        <span className="text-xs text-[#7b8f6f]">Day {batch.current_day}</span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-[10px] text-[#7b8f6f] mb-1">
                          <span>Progress</span><span>{pct}%</span>
                        </div>
                        <div className="w-full bg-[#e5ede0] rounded-full h-2">
                          <motion.div className="h-2 rounded-full bg-gradient-to-r from-[#5d8044] to-[#8acb88]"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}/>
                        </div>
                        <div className="flex justify-between text-[10px] text-[#7b8f6f] mt-0.5">
                          <span>{batch.planting_date}</span>
                          <span>{batch.harvest_date}</span>
                        </div>
                      </div>

                      {/* Today alert */}
                      {todayTask && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          <Bell className="h-3.5 w-3.5 text-amber-600 flex-shrink-0"/>
                          <p className="text-xs text-amber-800 font-medium">Due Today: {todayTask.template_name}</p>
                        </div>
                      )}

                      {/* Next task */}
                      {!todayTask && nextTask && (
                        <div className="flex items-center gap-2 bg-[#f3faf2] border border-[#d9ead6] rounded-xl px-3 py-2">
                          <ChevronRight className="h-3.5 w-3.5 text-[#5d8044] flex-shrink-0"/>
                          <div className="min-w-0">
                            <p className="text-xs text-[#3d5a36] font-medium truncate">{nextTask.template_name}</p>
                            <p className="text-[10px] text-[#7b8f6f]">Day {nextTask.days_after_planting} · {nextTask.due_date}</p>
                          </div>
                        </div>
                      )}

                      {/* Worker count */}
                      <div className="flex items-center gap-1.5 text-xs text-[#7b8f6f]">
                        <Users className="h-3.5 w-3.5"/>
                        <span>{batch.workers?.length || 0} worker{batch.workers?.length !== 1 ? "s" : ""} assigned</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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