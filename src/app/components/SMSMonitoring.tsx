import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { MessageSquare, CheckCircle, Clock, AlertCircle, Search, ChevronDown, ChevronUp, BarChart3, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "motion/react";

interface SMSLog {
  id: string;
  worker_id: string;
  worker_name: string | null;
  workerName?: string | null;
  worker?: string | null;
  phone: string;
  message: string;
  direction: "Outbound" | "Inbound";
  status: string;
  response_text: string | null;
  sent_at: string | null;
  received_at: string | null;
}

export function SMSMonitoring() {
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost/anialerto-backend/src/get_sms_logs.php";

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setSmsLogs(data);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getResponseBadge = (responseText: string | null) => {
    const text = responseText?.toUpperCase();
    if (text === "DONE") return { variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
    if (text === "DELAY") return { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" };
    if (text === "HELP") return { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" };
    return { variant: "outline" as const, icon: MessageSquare, color: "text-gray-400" };
  };

  const getWorkerName = (log: SMSLog) => {
    return log.worker_name || log.workerName || log.worker || "Unknown Worker";
  };

  const filteredLogs = smsLogs.filter(log => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = log.phone.includes(searchTerm) ||
                          getWorkerName(log).toLowerCase().includes(normalizedSearch) ||
                          log.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || log.response_text?.toUpperCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: smsLogs.length,
    done: smsLogs.filter(l => l.response_text?.toUpperCase() === "DONE").length,
    delay: smsLogs.filter(l => l.response_text?.toUpperCase() === "DELAY").length,
    help: smsLogs.filter(l => l.response_text?.toUpperCase() === "HELP").length,
    pending: smsLogs.filter(l => !l.response_text).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#3d5a36]">SMS Monitoring</h1>
          <p className="text-[#556d4a]">Real-time database feed of all system and worker messages</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" onClick={fetchLogs} disabled={loading} className="border-[#5d8044] text-[#3d5a36] bg-white shadow-lg shadow-[#5d8044]/10 hover:bg-[#f3f8f1] transition-all duration-200">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-[#7b8f6f] uppercase font-bold">Total</p>
              <p className="text-2xl font-bold text-[#3d5a36]">{stats.total}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-[#5d8044] uppercase font-bold">Done</p>
              <p className="text-2xl font-bold text-[#5d8044]">{stats.done}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-[#b7791f] uppercase font-bold">Delay</p>
              <p className="text-2xl font-bold text-[#b7791f]">{stats.delay}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-[#c53030] uppercase font-bold">Help</p>
              <p className="text-2xl font-bold text-[#c53030]">{stats.help}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-[#7b8f6f] uppercase font-bold">Pending</p>
              <p className="text-2xl font-bold text-[#7b8f6f]">{stats.pending}</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Visualizations (Optional Toggle) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
          <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-white overflow-hidden">
            <CollapsibleTrigger className="w-full">
              <Button variant="ghost" className="w-full p-6 flex justify-between items-center text-[#3d5a36] hover:bg-[#eff7ed] transition-colors duration-200">
                <div className="flex items-center gap-2 font-semibold"><BarChart3 className="h-5 w-5 text-[#5d8044]" /> SMS Analytics</div>
                {isVisualizationOpen ? <ChevronUp className="h-5 w-5 text-[#5d8044]" /> : <ChevronDown className="h-5 w-5 text-[#5d8044]" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-[#e5ede0] bg-[#f8fdf3] p-6">
              <div className="grid md:grid-cols-2 gap-8">
              <div className="h-[300px]">
                <h3 className="text-center font-bold mb-4">Response Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Done', value: stats.done },
                      { name: 'Delay', value: stats.delay },
                      { name: 'Help', value: stats.help },
                      { name: 'Pending', value: stats.pending }
                    ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#4ade80" /><Cell fill="#facc15" /><Cell fill="#f87171" /><Cell fill="#cbd5e1" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="h-[300px]">
                <h3 className="text-center font-bold mb-4">Daily Volume</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from(new Set(smsLogs.map(l => l.sent_at?.split(' ')[0]))).map(date => ({
                    date, count: smsLogs.filter(l => l.sent_at?.startsWith(date as string)).length
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8acb88" fill="#8acb88" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      </motion.div>

      {/* Main Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
          <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
            <div>
              <CardTitle className="text-[#3d5a36]">SMS Logs</CardTitle>
              <CardDescription className="text-[#556d4a]">Syncing with <b>anialerto.sms_logs</b></CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
                <Input placeholder="Search worker, phone, or message..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="border rounded-xl p-3 text-sm bg-white shadow-sm border-[#d9ead6]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Responses</option>
                <option value="DONE">Done</option>
                <option value="DELAY">Delay</option>
                <option value="HELP">Help</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-[30%]">Message</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Received At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => {
                const badge = getResponseBadge(log.response_text);
                const Icon = badge.icon;
                return (
                  <motion.tr
                    key={log.id}
                    className="hover:bg-[#eff7ed] transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.02 * index }}
                  >
                    <TableCell>
                      <Badge variant={log.direction === "Outbound" ? "outline" : "default"} className={log.direction === "Outbound" ? "border-[#5d8044] text-[#5d8044]" : "bg-[#5d8044]/10 text-[#5d8044]"}>
                        {log.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm text-[#3d5a36]">{getWorkerName(log)}</TableCell>
                    <TableCell className="font-mono text-xs text-[#556d4a]">
                      {log.phone}
                      {log.direction === "Inbound" && (
                        <span className="ml-1 font-sans text-[11px] text-[#7b8f6f]">
                          ({getWorkerName(log)})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[200px] text-[#556d4a]">{log.message}</TableCell>
                    <TableCell className="text-xs text-[#7b8f6f]">{log.sent_at || '-'}</TableCell>
                    <TableCell>
                      {log.response_text ? (
                        <Badge variant={badge.variant} className="flex items-center gap-1 w-fit px-2 py-1">
                          <Icon className={`h-3 w-3 ${badge.color}`} /> {log.response_text}
                        </Badge>
                      ) : <span className="text-[#7b8f6f]">No Reply</span>}
                    </TableCell>
                    <TableCell className="text-xs text-[#7b8f6f]">{log.received_at || '-'}</TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && <div className="p-8 text-center text-gray-400">No records found.</div>}
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
