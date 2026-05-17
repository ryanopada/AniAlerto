import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import {
  MessageSquare, CheckCircle, Clock, AlertCircle, Search,
  RefreshCw, Loader2, ChevronLeft, ChevronRight, Calendar,
  Inbox, AlertTriangle, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface SMSLog {
  id: string;
  worker_id: string;
  worker_name: string | null;
  phone: string;
  message: string;
  direction: "Outbound" | "Inbound";
  status: string;
  response_text: string | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string | null;
}

type DateFilter = "all" | "today" | "7days" | "30days" | "custom";

const DATE_FILTER_OPTIONS: { label: string; value: DateFilter }[] = [
  { label: "All Time", value: "all" },
  { label: "Today",    value: "today" },
  { label: "7 Days",   value: "7days" },
  { label: "30 Days",  value: "30days" },
  { label: "Custom",   value: "custom" },
];

const PER_PAGE = 20;
const API_URL  = "http://localhost/anialerto-backend/src/get_sms_logs.php";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDateTime(dt: string | null): string {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    + "  " + d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function getResponseMeta(rt: string | null) {
  const t = rt?.toUpperCase().trim();
  if (t === "DONE")  return { label: "DONE",  icon: CheckCircle,   cls: "bg-emerald-100 text-emerald-700 border-emerald-200", row: "bg-emerald-50/60" };
  if (t === "DELAY") return { label: "DELAY", icon: Clock,         cls: "bg-amber-100 text-amber-700 border-amber-200",       row: "bg-amber-50/60" };
  if (t === "HELP")  return { label: "HELP",  icon: AlertCircle,   cls: "bg-red-100 text-red-700 border-red-200",             row: "bg-red-50/60" };
  if (t === "PEST")  return { label: "PEST",  icon: AlertTriangle, cls: "bg-orange-100 text-orange-700 border-orange-200",    row: "bg-orange-50/60" };
  return { label: "—",   icon: MessageSquare, cls: "bg-gray-100 text-gray-500 border-gray-200",             row: "" };
}

// ── Skeleton Row ───────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      {[120, 80, 140, 200, 100, 90, 120].map((w, i) => (
        <TableCell key={i}><div className="h-4 rounded bg-gray-200" style={{ width: w }} /></TableCell>
      ))}
    </TableRow>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SMSMonitoring() {
  const [logs,        setLogs]        = useState<SMSLog[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFilter,  setDateFilter]  = useState<DateFilter>("all");
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, dateFilter, dateFrom, dateTo]);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams({
        page:        String(page),
        per_page:    String(PER_PAGE),
        date_filter: dateFilter,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateFilter === "custom") {
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo)   params.set("date_to",   dateTo);
      }
      const res  = await fetch(`${API_URL}?${params}`);
      const json = await res.json();
      setLogs(json.data        ?? []);
      setTotal(json.total      ?? 0);
      setTotalPages(json.total_pages ?? 1);
    } catch (err) {
      console.error("Error fetching SMS logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, dateFilter, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => fetchLogs(true), 30_000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const stats = {
    total:   total,
    done:    logs.filter(l => l.response_text?.toUpperCase() === "DONE").length,
    delay:   logs.filter(l => l.response_text?.toUpperCase() === "DELAY").length,
    help:    logs.filter(l => l.response_text?.toUpperCase() === "HELP").length,
    pending: logs.filter(l => !l.response_text).length,
  };

  const workerName = (log: SMSLog) =>
    log.worker_name || log.phone || "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-5 p-6">

      {/* ── Header ── */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">SMS Monitoring</h1>
          <p className="text-sm text-[#556d4a] mt-0.5">Real-time feed of all outbound messages & worker replies</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchLogs(true)}
          disabled={refreshing}
          className="border-[#5d8044] text-[#3d5a36] bg-white shadow-sm hover:bg-[#f3f8f1] shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* ── Stats Cards ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
      >
        {[
          { label: "Total",   value: total,        color: "text-[#3d5a36]", bg: "from-white to-[#f8fdf3]" },
          { label: "Done",    value: stats.done,   color: "text-emerald-600", bg: "from-white to-emerald-50" },
          { label: "Delay",   value: stats.delay,  color: "text-amber-600",   bg: "from-white to-amber-50" },
          { label: "Help",    value: stats.help,   color: "text-red-600",     bg: "from-white to-red-50" },
          { label: "Pending", value: stats.pending,color: "text-gray-500",    bg: "from-white to-gray-50" },
        ].map(s => (
          <motion.div key={s.label} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="rounded-2xl border border-[#d9ead6] shadow-lg bg-gradient-to-br from-white to-[#f8fdf3]">
              <CardContent className="pt-5 pb-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7b8f6f]">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Date filter pills + search */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Date pills */}
          <div className="flex flex-wrap gap-1.5">
            {DATE_FILTER_OPTIONS.map(o => (
              <button
                key={o.value}
                onClick={() => setDateFilter(o.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  dateFilter === o.value
                    ? "bg-[#5d8044] text-white border-[#5d8044] shadow-sm"
                    : "bg-white text-[#556d4a] border-[#d9ead6] hover:border-[#5d8044] hover:text-[#3d5a36]"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {o.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
            <Input
              placeholder="Search phone or message..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 border-[#d9ead6] focus:border-[#5d8044] rounded-xl"
            />
          </div>
        </div>

        {/* Custom date range */}
        <AnimatePresence>
          {dateFilter === "custom" && (
            <motion.div
              className="flex flex-wrap gap-3 items-center p-3 bg-white border border-[#d9ead6] rounded-xl shadow-sm"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-xs font-semibold text-[#556d4a]">From</span>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-auto border-[#d9ead6] rounded-lg text-sm" />
              <span className="text-xs font-semibold text-[#556d4a]">To</span>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-auto border-[#d9ead6] rounded-lg text-sm" />
              {(dateFrom || dateTo) && (
                <Button size="sm" variant="ghost" className="text-xs text-[#7b8f6f]"
                  onClick={() => { setDateFrom(""); setDateTo(""); }}>
                  Clear
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Table Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border border-[#d9ead6] rounded-2xl shadow-xl bg-white overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#f5fbf3] px-6 py-4 border-b border-[#e5ede0]">
            <div>
              <CardTitle className="text-[#3d5a36] text-base">SMS Logs</CardTitle>
              <CardDescription className="text-[#556d4a] text-xs mt-0.5">
                {loading ? "Loading…" : `Showing ${((page-1)*PER_PAGE)+1}–${Math.min(page*PER_PAGE, total)} of ${total} messages`}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f9fcf7] border-b border-[#e8f0e5]">
                    <TableHead className="pl-6 py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide w-[110px]">Status</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide">Worker</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide">Phone</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide w-[35%]">Message</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide w-[90px]">Reply</TableHead>
                    <TableHead className="py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide">Sent At</TableHead>
                    <TableHead className="pr-6 py-3 text-xs font-bold text-[#556d4a] uppercase tracking-wide">Replied At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Loading skeleton */}
                  {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                  {/* Data rows */}
                  {!loading && logs.map((log, i) => {
                    const meta     = getResponseMeta(log.response_text);
                    const Icon     = meta.icon;
                    const isReplied = !!log.response_text;
                    return (
                      <motion.tr
                        key={log.id}
                        className={`border-b border-[#f0f5ee] transition-colors duration-150 hover:bg-[#f5fbf3] ${meta.row}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.02 }}
                      >
                        {/* Status */}
                        <TableCell className="pl-6 py-4">
                          {isReplied ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1 w-fit px-2">
                              <CheckCircle className="h-2.5 w-2.5" /> Replied
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 border-gray-300 text-[10px] font-semibold flex items-center gap-1 w-fit px-2">
                              <Clock className="h-2.5 w-2.5" /> Pending
                            </Badge>
                          )}
                        </TableCell>

                        {/* Worker */}
                        <TableCell className="py-4">
                          <span className="text-sm font-semibold text-[#3d5a36]">{workerName(log)}</span>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="py-4">
                          <span className="flex items-center gap-1 text-xs font-mono text-[#556d4a]">
                            <Phone className="h-3 w-3 text-[#7b8f6f] shrink-0" />
                            {log.phone}
                          </span>
                        </TableCell>

                        {/* Message */}
                        <TableCell className="py-4 max-w-xs">
                          <p className="text-xs text-[#556d4a] leading-relaxed line-clamp-3 break-words">
                            {log.message}
                          </p>
                        </TableCell>

                        {/* Reply badge */}
                        <TableCell className="py-4">
                          {isReplied ? (
                            <Badge className={`border text-[10px] font-bold flex items-center gap-1 w-fit px-2 ${meta.cls}`}>
                              <Icon className="h-2.5 w-2.5" />
                              {meta.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400 italic">—</span>
                          )}
                        </TableCell>

                        {/* Sent At */}
                        <TableCell className="py-4">
                          <span className="text-xs text-[#7b8f6f] whitespace-nowrap">{formatDateTime(log.sent_at)}</span>
                        </TableCell>

                        {/* Replied At */}
                        <TableCell className="pr-6 py-4">
                          <span className="text-xs text-[#7b8f6f] whitespace-nowrap">{formatDateTime(log.received_at)}</span>
                        </TableCell>
                      </motion.tr>
                    );
                  })}

                  {/* Empty state */}
                  {!loading && logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-[#7b8f6f]">
                          <Inbox className="h-12 w-12 text-[#c5d9be]" />
                          <p className="font-semibold text-[#556d4a]">No messages found</p>
                          <p className="text-xs">
                            {search || dateFilter !== "all"
                              ? "Try adjusting your filters or search term."
                              : "Outbound SMS messages will appear here once sent."}
                          </p>
                          {(search || dateFilter !== "all") && (
                            <Button size="sm" variant="outline" className="mt-1 text-xs border-[#d9ead6] text-[#3d5a36]"
                              onClick={() => { setSearch(""); setDateFilter("all"); }}>
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ── */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#e8f0e5] bg-[#f9fcf7]">
                <span className="text-xs text-[#7b8f6f]">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm" variant="outline"
                    className="border-[#d9ead6] text-[#3d5a36] h-8 w-8 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {/* Page number pills */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2 + i, totalPages - (Math.min(5, totalPages) - 1 - i)));
                    return (
                      <Button key={p} size="sm"
                        variant={p === page ? "default" : "outline"}
                        className={`h-8 w-8 p-0 text-xs ${p === page ? "bg-[#5d8044] hover:bg-[#4a6b36] text-white border-0" : "border-[#d9ead6] text-[#3d5a36]"}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm" variant="outline"
                    className="border-[#d9ead6] text-[#3d5a36] h-8 w-8 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
