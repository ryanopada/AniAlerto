import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Inbox, CheckCircle, Clock, AlertCircle, Search, RefreshCw, Loader2, MessageSquare, User, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface InboundMessage {
  id: string;
  phone: string;
  message: string;
  command: string | null;
  received_at: string;
  processed_at: string | null;
  worker_name: string | null;
  worker_id: string | null;
  batch_name: string | null;
}

interface Summary {
  total: number;
  done: number;
  delay: number;
  help: number;
  other: number;
  unprocessed: number;
}

export function InboundMessages() {
  const [messages, setMessages] = useState<InboundMessage[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCommand, setFilterCommand] = useState("All");

  const API_URL = "http://localhost/anialerto-backend/src/get_inbound_messages.php";

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setMessages(data.messages || []);
      setSummary(data.summary || null);
    } catch (e) {
      console.error("Error fetching inbound messages:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      const cmd = (m.command || m.message || "").toUpperCase();
      const matchesSearch =
        (m.worker_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterCommand === "All" ||
        cmd === filterCommand;
      return matchesSearch && matchesFilter;
    });
  }, [messages, searchTerm, filterCommand]);

  const getCommandStyle = (cmd: string | null, msg: string) => {
    const c = (cmd || msg || "").toUpperCase().trim();
    if (c === "DONE") return { bg: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle, color: "text-green-600" };
    if (c === "DELAY") return { bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock, color: "text-yellow-600" };
    if (c === "HELP") return { bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-800 border-red-300", icon: AlertCircle, color: "text-red-600" };
    return { bg: "hover:bg-[#eff7ed]", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: MessageSquare, color: "text-gray-500" };
  };

  const formatTime = (d: string) =>
    new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Worker Responses</h1>
          <p className="text-[#556d4a]">Inbound SMS replies from farm workers — DONE, DELAY, HELP</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" onClick={fetchMessages} disabled={loading} className="border-[#5d8044] text-[#3d5a36] bg-white shadow-lg shadow-[#5d8044]/10">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      {summary && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
        >
          {[
            { label: "Total", value: summary.total, icon: <Inbox />, color: "text-[#3d5a36]", border: "border-l-[#5d8044]" },
            { label: "Done", value: summary.done, icon: <CheckCircle />, color: "text-green-700", border: "border-l-green-500" },
            { label: "Delay", value: summary.delay, icon: <Clock />, color: "text-yellow-700", border: "border-l-yellow-500" },
            { label: "Help", value: summary.help, icon: <AlertCircle />, color: "text-red-700", border: "border-l-red-500" },
            { label: "Other", value: summary.other, icon: <HelpCircle />, color: "text-gray-600", border: "border-l-gray-400" },
          ].map((s) => (
            <motion.div key={s.label} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className={`border-l-4 ${s.border} rounded-[1.5rem] bg-gradient-to-br from-white to-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20 border-[#d9ead6]`}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-[#7b8f6f] uppercase">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#eff7ec] text-[#5d8044] shadow-sm">{s.icon}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Messages Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
        <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
          <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
            <div>
              <CardTitle className="text-[#3d5a36]">Inbound Messages</CardTitle>
              <CardDescription className="text-[#556d4a]">Worker SMS replies from <b>inbound_messages</b> table</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
                <Input placeholder="Search name or phone..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="border rounded-xl p-3 text-sm bg-white shadow-sm border-[#d9ead6]" value={filterCommand} onChange={(e) => setFilterCommand(e.target.value)}>
                <option value="All">All Commands</option>
                <option value="DONE">DONE</option>
                <option value="DELAY">DELAY</option>
                <option value="HELP">HELP</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#5d8044] h-8 w-8" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-[#7b8f6f]">
                <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No inbound messages found</p>
                <p className="text-sm">Worker replies will appear here when they respond to SMS</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead className="w-[80px]">Command</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="w-[140px]">Received</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((msg, i) => {
                    const style = getCommandStyle(msg.command, msg.message);
                    const Icon = style.icon;
                    return (
                      <motion.tr
                        key={msg.id}
                        className={`transition-colors duration-200 ${style.bg}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.02 }}
                      >
                        <TableCell>
                          <Badge variant="outline" className={`border ${style.badge} flex items-center gap-1 w-fit`}>
                            <Icon className={`h-3 w-3 ${style.color}`} />
                            {(msg.command || msg.message || "—").toUpperCase().substring(0, 10)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#5d8044]" />
                            <span className="font-medium text-[#3d5a36]">{msg.worker_name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-[#556d4a]">{msg.phone}</TableCell>
                        <TableCell className="text-sm text-[#3d5a36] max-w-[200px] truncate">{msg.message}</TableCell>
                        <TableCell>
                          {msg.batch_name ? (
                            <Badge variant="outline" className="border-[#d9ead6] text-[#556d4a]">{msg.batch_name}</Badge>
                          ) : <span className="text-xs text-[#7b8f6f]">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-[#7b8f6f] whitespace-nowrap">{formatTime(msg.received_at)}</TableCell>
                        <TableCell>
                          <Badge className={msg.processed_at ? "bg-[#e4fde1] text-[#5d8044]" : "bg-yellow-100 text-yellow-700"}>
                            {msg.processed_at ? "Processed" : "Pending"}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
