import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { MessageSquare, CheckCircle, Clock, AlertCircle, Search, Plus, Edit, Trash2, ChevronDown, ChevronUp, BarChart3, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

interface SMSLog {
  id: string;
  worker_id: string;
  phone: string;
  message: string;
  direction: "Outbound" | "Inbound";
  status: string;
  response_text: string | null;
  sent_at: string | null;
  received_at: string | null;
}

interface CommandResponse {
  id: string;
  command: string;
  description: string;
  color: string;
  action: string;
}

export function SMSMonitoring() {
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  
  const [commandResponses, setCommandResponses] = useState<CommandResponse[]>([
    { id: "CMD001", command: "DONE", description: "Task completed", color: "green", action: "Complete task" },
    { id: "CMD002", command: "DELAY", description: "Task delayed", color: "yellow", action: "Flag follow-up" },
    { id: "CMD003", command: "HELP", description: "Worker needs help", color: "red", action: "Send support" }
  ]);

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

  const filteredLogs = smsLogs.filter(log => {
    const matchesSearch = log.phone.includes(searchTerm) || 
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
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">SMS Monitoring</h1>
          <p className="text-gray-600">Real-time database feed of all system and worker messages</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading} className="border-[#8acb88]">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-gray-500 uppercase font-bold">Total</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-green-600 uppercase font-bold">Done</p><p className="text-2xl font-bold text-green-600">{stats.done}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-yellow-600 uppercase font-bold">Delay</p><p className="text-2xl font-bold text-yellow-600">{stats.delay}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-red-600 uppercase font-bold">Help</p><p className="text-2xl font-bold text-red-600">{stats.help}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-xs text-gray-500 uppercase font-bold">Pending</p><p className="text-2xl font-bold text-gray-400">{stats.pending}</p></CardContent></Card>
      </div>

      {/* Visualizations (Optional Toggle) */}
      <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
        <Card className="border-[#8acb88]">
          <CollapsibleTrigger className="w-full p-4 flex justify-between items-center hover:bg-gray-50">
            <div className="flex items-center gap-2 font-semibold"><BarChart3 className="h-5 w-5 text-[#8acb88]" /> SMS Analytics</div>
            {isVisualizationOpen ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-6 border-t">
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

      {/* Main Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>SMS Logs</CardTitle><CardDescription>Syncing with <b>anialerto.sms_logs</b></CardDescription></div>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search phone or message..." className="pl-8 w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="border rounded p-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                <TableHead>Phone</TableHead>
                <TableHead className="w-[30%]">Message</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Received At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const badge = getResponseBadge(log.response_text);
                const Icon = badge.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant={log.direction === "Outbound" ? "outline" : "default"}>
                        {log.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.phone}</TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">{log.message}</TableCell>
                    <TableCell className="text-xs text-gray-500">{log.sent_at || '-'}</TableCell>
                    <TableCell>
                      {log.response_text ? (
                        <Badge variant={badge.variant} className="flex items-center gap-1 w-fit">
                          <Icon className={`h-3 w-3 ${badge.color}`} /> {log.response_text}
                        </Badge>
                      ) : <span className="text-gray-300">No Reply</span>}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{log.received_at || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && <div className="p-8 text-center text-gray-400">No records found.</div>}
        </CardContent>
      </Card>
    </div>
  );
}