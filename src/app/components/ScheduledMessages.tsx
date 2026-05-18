import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  Trash2, CheckCircle2, FlaskConical, ShieldCheck, Clock, AlertTriangle,
  RefreshCw, Layers, CalendarClock, ListChecks, Filter, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "./ui/input";

interface ScheduledMsg {
  id: string;
  name: string;
  category: string;
  message: string;
  scheduled_send_datetime: string | null;
  active: number;
  is_test: number;
  queued_at: string | null;
  batch_id: string | null;
  batch_name: string | null;
  queued_count: number;
  sent_count: number;
}

type FilterTab = "all" | "pending" | "test" | "processed";

const MANAGE_URL = "http://localhost/anialerto-backend/src/manage_scheduled.php";

export function ScheduledMessages() {
  const [messages, setMessages] = useState<ScheduledMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(MANAGE_URL);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load scheduled messages.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? Any pending SMS queue entries will be cancelled.`)) return;
    setBusy(id + "-del");
    const res = await fetch(`${MANAGE_URL}?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.status === "deleted") {
      showToast(`"${name}" deleted successfully.`);
      await fetchMessages();
    } else {
      showToast("Delete failed.", "error");
    }
    setBusy(null);
  };

  const handleMarkSent = async (id: string, name: string) => {
    if (!confirm(`Mark "${name}" as sent? The scheduler will skip it and pending queue entries will be cancelled.`)) return;
    setBusy(id + "-sent");
    await fetch(MANAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "mark_sent" }),
    });
    showToast(`"${name}" marked as sent.`);
    await fetchMessages();
    setBusy(null);
  };

  const handleToggleTest = async (id: string, currentIsTest: number) => {
    setBusy(id + "-test");
    await fetch(MANAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle_test" }),
    });
    showToast(currentIsTest ? "Test flag removed." : "Marked as test — scheduler will skip this.");
    await fetchMessages();
    setBusy(null);
  };

  const handleMarkAllTestSent = async () => {
    const testPending = messages.filter(m => m.is_test === 1 && m.active === 1 && !m.queued_at);
    if (testPending.length === 0) { showToast("No pending test messages to mark.", "error"); return; }
    if (!confirm(`Mark all ${testPending.length} pending test message(s) as sent? This cannot be undone.`)) return;
    setBusy("bulk");
    for (const m of testPending) {
      await fetch(MANAGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, action: "mark_sent" }),
      });
    }
    showToast(`${testPending.length} test message(s) marked as sent.`);
    await fetchMessages();
    setBusy(null);
  };

  const stats = useMemo(() => ({
    total: messages.length,
    pending: messages.filter(m => m.active === 1 && !m.queued_at).length,
    test: messages.filter(m => m.is_test === 1).length,
    processed: messages.filter(m => !m.active || m.queued_at).length,
  }), [messages]);

  const filtered = useMemo(() => {
    let list = messages;
    if (tab === "pending") list = list.filter(m => m.active === 1 && !m.queued_at && m.is_test === 0);
    if (tab === "test")    list = list.filter(m => m.is_test === 1);
    if (tab === "processed") list = list.filter(m => !m.active || !!m.queued_at);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.batch_name ?? "").toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, tab, search]);

  const getStatusInfo = (m: ScheduledMsg) => {
    if (m.is_test === 1)            return { label: "Test", cls: "bg-amber-100 text-amber-800 border-amber-300" };
    if (!m.active || m.queued_at)   return { label: "Processed", cls: "bg-gray-100 text-gray-600 border-gray-300" };
    return { label: "Pending", cls: "bg-green-100 text-green-800 border-green-300" };
  };

  const fmtDT = (dt: string | null) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",       label: "All",       count: stats.total     },
    { key: "pending",   label: "Pending",   count: stats.pending   },
    { key: "test",      label: "Test",      count: stats.test      },
    { key: "processed", label: "Processed", count: stats.processed },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium text-white ${
              toast.type === "success" ? "bg-[#5d8044]" : "bg-red-600"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36] flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-[#5d8044]" />
            Scheduled Messages
          </h1>
          <p className="text-[#556d4a] mt-1">Manage, clean up, and control pending scheduled SMS messages</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMessages}
            className="border-[#d9ead6] text-[#5d8044] hover:bg-[#eff7ed]"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={handleMarkAllTestSent}
            disabled={busy === "bulk" || stats.test === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Mark All Tests as Sent
          </Button>
        </div>
      </motion.div>

      {/* Warning Banner */}
      {stats.test > 0 && stats.pending > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-800"
        >
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold">Test messages detected!</p>
            <p className="text-sm mt-0.5">
              There are <strong>{stats.test}</strong> test message(s) in the system. The scheduler already skips them,
              but you should delete or mark them as sent before adding new workers to prevent confusion.
            </p>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total",     value: stats.total,     icon: <ListChecks />,   color: "border-l-[#5d8044]", text: "text-[#3d5a36]" },
          { label: "Pending",   value: stats.pending,   icon: <Clock />,        color: "border-l-blue-400",  text: "text-blue-700"  },
          { label: "Test",      value: stats.test,      icon: <FlaskConical />, color: "border-l-amber-400", text: "text-amber-700" },
          { label: "Processed", value: stats.processed, icon: <CheckCircle2 />, color: "border-l-gray-400",  text: "text-gray-600"  },
        ].map((s) => (
          <motion.div key={s.label} whileHover={{ y: -4, scale: 1.02 }}>
            <Card className={`border-l-4 ${s.color} rounded-2xl bg-white shadow-lg border-[#d9ead6]`}>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-[#7b8f6f] uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                </div>
                <div className="p-2 rounded-xl bg-[#eff7ec] text-[#5d8044]">{s.icon}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Table Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0] p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-[#3d5a36]">Scheduled Message List</CardTitle>
                <CardDescription className="text-[#556d4a]">
                  Delete or mark messages to prevent them from reaching workers
                </CardDescription>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
                <Input
                  placeholder="Search messages..."
                  className="pl-9 border-[#d9ead6] w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Filter className="h-4 w-4 text-[#7b8f6f] self-center" />
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    tab === t.key
                      ? "bg-[#5d8044] text-white border-[#5d8044] shadow"
                      : "bg-white text-[#556d4a] border-[#d9ead6] hover:bg-[#eff7ed]"
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    tab === t.key ? "bg-white/20" : "bg-[#eff7ec] text-[#5d8044]"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Queued</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-[#7b8f6f]">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading scheduled messages…
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-[#7b8f6f]">
                        <CalendarClock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        No scheduled messages found.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((m, i) => {
                    const status = getStatusInfo(m);
                    const isDelBusy  = busy === m.id + "-del";
                    const isSentBusy = busy === m.id + "-sent";
                    const isTestBusy = busy === m.id + "-test";
                    const anyBusy    = !!(busy);
                    return (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-[#f5fbf3] transition-colors border-b border-[#f0f7ee]"
                      >
                        <TableCell className="pl-6 font-medium text-[#3d5a36] max-w-[180px]">
                          <p className="truncate" title={m.name}>{m.name}</p>
                          <p className="text-xs text-[#7b8f6f] truncate mt-0.5" title={m.message}>{m.message}</p>
                        </TableCell>
                        <TableCell>
                          {m.batch_name
                            ? <Badge variant="outline" className="border-[#d9ead6] text-[#3d5a36] gap-1">
                                <Layers className="h-3 w-3" />{m.batch_name}
                              </Badge>
                            : <span className="text-xs text-[#7b8f6f] italic">All Batches</span>}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-[#556d4a] flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#5d8044]" />
                            {fmtDT(m.scheduled_send_datetime)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-[#556d4a] font-mono text-sm">{m.queued_count}</TableCell>
                        <TableCell className="text-center text-[#556d4a] font-mono text-sm">{m.sent_count}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${status.cls}`}>
                              {status.label}
                            </span>
                            {m.is_test === 1 && (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <FlaskConical className="h-3 w-3" /> Test flag
                              </span>
                            )}
                            {m.queued_at && (
                              <span className="text-xs text-gray-400">Queued: {fmtDT(m.queued_at)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex gap-1.5 justify-end flex-wrap">
                            {/* Toggle Test */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={anyBusy}
                                onClick={() => handleToggleTest(m.id, m.is_test)}
                                title={m.is_test ? "Remove test flag" : "Mark as test"}
                                className={`border gap-1 text-xs ${
                                  m.is_test
                                    ? "border-amber-400 text-amber-700 hover:bg-amber-50"
                                    : "border-[#d9ead6] text-[#556d4a] hover:bg-[#eff7ed]"
                                }`}
                              >
                                {isTestBusy
                                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                                  : <FlaskConical className="h-3 w-3" />}
                                {m.is_test ? "Unflag" : "Test"}
                              </Button>
                            </motion.div>

                            {/* Mark as Sent */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={anyBusy || (!m.active && !!m.queued_at)}
                                onClick={() => handleMarkSent(m.id, m.name)}
                                title="Mark as sent — scheduler will skip"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-1 text-xs"
                              >
                                {isSentBusy
                                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                                  : <CheckCircle2 className="h-3 w-3" />}
                                Mark Sent
                              </Button>
                            </motion.div>

                            {/* Delete */}
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={anyBusy}
                                onClick={() => handleDelete(m.id, m.name)}
                                title="Permanently delete"
                                className="gap-1 text-xs"
                              >
                                {isDelBusy
                                  ? <RefreshCw className="h-3 w-3 animate-spin" />
                                  : <Trash2 className="h-3 w-3" />}
                                Delete
                              </Button>
                            </motion.div>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="rounded-2xl border border-[#d9ead6] bg-[#f8fdf3] shadow">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-[#7b8f6f] uppercase mb-3 tracking-wide">How it works</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#556d4a]">
              <div className="flex items-start gap-2">
                <FlaskConical className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p><strong className="text-amber-700">Mark as Test</strong> — Flags the message. The scheduler skips all test messages automatically, so they will never be sent to workers.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p><strong className="text-blue-700">Mark as Sent</strong> — Deactivates the template and cancels pending queue entries. The scheduler will permanently skip it.</p>
              </div>
              <div className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p><strong className="text-red-700">Delete</strong> — Permanently removes the template and cancels all associated queue entries. Cannot be undone.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
