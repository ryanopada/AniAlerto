import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Search, Users, UserCheck, UserX, ChevronDown, ChevronUp, BarChart3, Loader2, MessageSquare, Send, Inbox, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface Worker {
  id: string;
  name: string;
  phone: string;
  assignedBatch: string;
  status: "Active" | "Inactive";
}

interface Batch {
  id: string;
  name: string;
}

interface SMSRecord {
  id: string;
  phone: string;
  message: string;
  direction: "Sent" | "Received";
  status: string;
  timestamp: string;
}

interface SMSSummary {
  total_sent: number;
  total_received: number;
  done_count: number;
  delay_count: number;
  help_count: number;
}

export function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [smsHistory, setSmsHistory] = useState<SMSRecord[]>([]);
  const [smsSummary, setSmsSummary] = useState<SMSSummary | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Quick Send SMS state
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState<"all" | "batch" | "individual">("all");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [smsMessage, setSmsMessage] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    assignedBatch: "",
    status: "Active" as Worker["status"],
  });

  const WORKER_API_URL = "http://localhost/anialerto-backend/src/workers.php";
  const BATCH_API_URL = "http://localhost/anialerto-backend/src/batches.php";
  const SMS_HISTORY_API_URL = "http://localhost/anialerto-backend/src/worker_sms_history.php";

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(WORKER_API_URL);
      if (!response.ok) throw new Error("Failed to fetch workers");
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error("Error loading workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch(BATCH_API_URL);
      if (!response.ok) throw new Error("Failed to fetch batches");
      const data = await response.json();
      if (Array.isArray(data)) {
        setBatches(data);
      }
    } catch (error) {
      console.error("Error loading batches for dropdown:", error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchBatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingWorker ? "PUT" : "POST";
    
    try {
      const response = await fetch(WORKER_API_URL, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWorker ? { ...formData, id: editingWorker.id } : formData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchWorkers();
      }
    } catch (error) {
      console.error("Error saving worker:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this worker?")) return;
    
    try {
      const response = await fetch(`${WORKER_API_URL}?id=${id}`, { method: "DELETE" });
      if (response.ok) fetchWorkers();
    } catch (error) {
      console.error("Error deleting worker:", error);
    }
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            worker.id.toString().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || worker.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workers, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: workers.length,
    active: workers.filter(w => w.status === "Active").length,
    inactive: workers.filter(w => w.status === "Inactive").length
  }), [workers]);

  const handleOpenEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      assignedBatch: worker.assignedBatch,
      status: worker.status,
    });
    fetchBatches();
    setIsDialogOpen(true);
  };

  const fetchSmsHistory = async (worker: Worker) => {
    setSelectedWorker(worker);
    setIsSmsDialogOpen(true);
    setSmsLoading(true);
    setSmsHistory([]);
    setSmsSummary(null);
    try {
      const response = await fetch(`${SMS_HISTORY_API_URL}?phone=${encodeURIComponent(worker.phone)}`);
      const data = await response.json();
      setSmsHistory(data.messages || []);
      setSmsSummary(data.summary || null);
    } catch (error) {
      console.error("Error fetching SMS history:", error);
    } finally {
      setSmsLoading(false);
    }
  };

  const openQuickSend = () => {
    setIsQuickSendOpen(true);
    setSmsMessage("");
    setSendTo("all");
    setSelectedBatchId("");
    setSelectedWorkerIds([]);
    setSendResult(null);
    fetchBatches();
  };

  const handleSendSms = async () => {
    if (!smsMessage.trim()) return;
    setSendLoading(true);
    try {
      const res = await fetch("http://localhost/anialerto-backend/src/send_manual_sms.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          send_to: sendTo,
          batch_id: selectedBatchId || null,
          worker_ids: selectedWorkerIds,
          message: smsMessage,
        }),
      });
      const data = await res.json();
      setIsQuickSendOpen(false);
      setSendResult({
        type: data.status === "success" ? "success" : "error",
        message: data.message,
      });
      setTimeout(() => setSendResult(null), 8000);
    } catch {
      setSendResult({ type: "error", message: "Failed to send. Is the backend running?" });
      setTimeout(() => setSendResult(null), 8000);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Worker Management</h1>
          <p className="text-[#556d4a]">System registry for AniAlerto field personnel</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={openQuickSend}
              variant="outline"
              className="border-[#5d8044] text-[#3d5a36] bg-white shadow-lg shadow-[#5d8044]/10 hover:bg-[#f3f8f1]"
            >
              <Send className="h-4 w-4 mr-2" /> Quick Send SMS
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button className="bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]" onClick={() => { 
              setEditingWorker(null); 
              setFormData({ name: "", phone: "", assignedBatch: "", status: "Active" });
              fetchBatches(); 
              setIsDialogOpen(true); 
            }}>
              <Plus className="h-4 w-4 mr-2" /> Register Worker
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Send Result Notification */}
      <AnimatePresence>
        {sendResult && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`rounded-[1rem] border shadow-md ${sendResult.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {sendResult.type === "success"
                      ? <CheckCircle className="h-5 w-5 text-green-600" />
                      : <AlertCircle className="h-5 w-5 text-red-600" />
                    }
                    <p className={`font-medium text-sm ${sendResult.type === "success" ? "text-green-800" : "text-red-800"}`}>
                      {sendResult.message}
                    </p>
                  </div>
                  <button onClick={() => setSendResult(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <StatCard title="Total Registry" value={stats.total} icon={<Users />} color="border-l-[#5d8044]" textColor="text-[#3d5a36]" />
        <StatCard title="Active Personnel" value={stats.active} icon={<UserCheck />} color="border-l-[#5d8044]" textColor="text-[#5d8044]" />
        <StatCard title="Inactive" value={stats.inactive} icon={<UserX />} color="border-l-gray-300" textColor="text-gray-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen} className="border border-[#d9ead6] rounded-[1.5rem] overflow-hidden shadow-2xl shadow-[#a4c692]/20 bg-white">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center p-6 hover:bg-[#eff7ed] transition-colors duration-200">
              <div className="flex items-center gap-3 text-[#3d5a36]">
                <BarChart3 className="h-5 w-5 text-[#5d8044]" />
                <span className="font-semibold">Deployment Analytics</span>
              </div>
              {isVisualizationOpen ? <ChevronUp className="text-[#5d8044]" /> : <ChevronDown className="text-[#5d8044]" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-6 border-t border-[#e5ede0] bg-[#f8fdf3]">
            <div className="h-[250px] w-full rounded-[1.25rem] bg-white shadow-inner shadow-[#a4c692]/10 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Active', count: stats.active }, { name: 'Inactive', count: stats.inactive }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#648381" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleContent>
        </Collapsible>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
            <div>
              <CardTitle className="text-[#3d5a36]">Personnel Registry</CardTitle>
              <CardDescription className="text-[#556d4a]">Manage your field team assignments</CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
                <Input placeholder="Search..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#5d8044]" /></div>
            ) : (
              <Table>
                <TableHeader className="bg-[#f3faf2]">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkers.map((worker, index) => (
                    <motion.tr
                      key={worker.id}
                      className="hover:bg-[#eff7ed] transition-colors duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                    >
                      <TableCell className="font-mono text-xs text-[#556d4a]">{worker.id}</TableCell>
                      <TableCell>
                        <button
                          className="font-medium text-[#3d5a36] hover:text-[#5d8044] hover:underline cursor-pointer flex items-center gap-1.5 transition-colors duration-200"
                          onClick={() => fetchSmsHistory(worker)}
                        >
                          {worker.name}
                          <MessageSquare className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-[#5d8044]" />
                        </button>
                      </TableCell>
                      <TableCell className="text-[#556d4a]">{worker.phone}</TableCell>
                      <TableCell><Badge variant="outline" className="border-[#d9ead6] text-[#556d4a]">{worker.assignedBatch}</Badge></TableCell>
                      <TableCell>
                        <Badge className={worker.status === "Active" ? "bg-[#e4fde1] text-[#5d8044]" : "bg-gray-100 text-gray-500"}>
                          {worker.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(worker)}><Edit className="h-4 w-4 text-[#5d8044]" /></Button>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(worker.id)}><Trash2 className="h-4 w-4" /></Button>
                        </motion.button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20">
          <DialogHeader>
            <DialogTitle className="text-[#3d5a36]">{editingWorker ? "Edit Worker" : "Register Worker"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Batch Assignment</Label>
              <select 
                className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6]"
                value={formData.assignedBatch} 
                onChange={e => setFormData({...formData, assignedBatch: e.target.value})}
                required
              >
                <option value="" disabled>Select a batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.name}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6]" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button type="submit" className="w-full bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]">Save Worker</Button>
            </motion.div>
          </form>
        </DialogContent>
      </Dialog>

      {/* SMS History Dialog */}
      <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20">
          <DialogHeader className="pb-4 border-b border-[#e5ede0]">
            <DialogTitle className="text-[#3d5a36] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#5d8044]" />
              SMS History — {selectedWorker?.name}
            </DialogTitle>
            <DialogDescription className="text-[#556d4a]">
              {selectedWorker?.phone} • All sent and received messages
            </DialogDescription>
          </DialogHeader>

          {smsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-[#5d8044] h-8 w-8" />
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Summary Stats */}
              {smsSummary && (
                <motion.div
                  className="grid grid-cols-2 md:grid-cols-5 gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white rounded-xl p-3 border border-[#d9ead6] text-center">
                    <div className="flex items-center justify-center gap-1 text-[#5d8044] mb-1">
                      <Send className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase">Sent</span>
                    </div>
                    <p className="text-xl font-bold text-[#3d5a36]">{smsSummary.total_sent}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-[#d9ead6] text-center">
                    <div className="flex items-center justify-center gap-1 text-[#5d8044] mb-1">
                      <Inbox className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase">Received</span>
                    </div>
                    <p className="text-xl font-bold text-[#3d5a36]">{smsSummary.total_received}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-green-200 text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase">Done</span>
                    </div>
                    <p className="text-xl font-bold text-green-700">{smsSummary.done_count}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-yellow-200 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase">Delay</span>
                    </div>
                    <p className="text-xl font-bold text-yellow-700">{smsSummary.delay_count}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-red-200 text-center">
                    <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase">Help</span>
                    </div>
                    <p className="text-xl font-bold text-red-700">{smsSummary.help_count}</p>
                  </div>
                </motion.div>
              )}

              {/* SMS Messages Table */}
              {smsHistory.length === 0 ? (
                <div className="text-center py-12 text-[#7b8f6f]">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No SMS records found</p>
                  <p className="text-sm">Messages will appear here once sent or received</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#f3faf2]">
                    <TableRow>
                      <TableHead className="w-[90px]">Direction</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[90px]">Status</TableHead>
                      <TableHead className="w-[150px]">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsHistory.map((sms, index) => (
                      <motion.tr
                        key={`${sms.direction}-${sms.id}`}
                        className="hover:bg-[#eff7ed] transition-colors duration-200"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                      >
                        <TableCell>
                          <Badge
                            className={sms.direction === "Sent"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-[#e4fde1] text-[#5d8044] border-[#d9ead6]"
                            }
                          >
                            {sms.direction === "Sent" ? (
                              <><Send className="h-3 w-3 mr-1" />Sent</>
                            ) : (
                              <><Inbox className="h-3 w-3 mr-1" />Reply</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#3d5a36] max-w-[300px]">
                          <p className="line-clamp-2">{sms.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              sms.status === "Sent" ? "border-green-300 text-green-700" :
                              sms.status === "DONE" ? "border-green-300 text-green-700 bg-green-50" :
                              sms.status === "DELAY" ? "border-yellow-300 text-yellow-700 bg-yellow-50" :
                              sms.status === "HELP" ? "border-red-300 text-red-700 bg-red-50" :
                              sms.status === "Queued" ? "border-gray-300 text-gray-600" :
                              sms.status === "Failed" ? "border-red-300 text-red-600" :
                              "border-[#d9ead6] text-[#556d4a]"
                            }
                          >
                            {sms.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-[#7b8f6f] whitespace-nowrap">
                          {sms.timestamp ? new Date(sms.timestamp).toLocaleString('en-PH', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-'}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Send SMS Dialog */}
      <Dialog open={isQuickSendOpen} onOpenChange={setIsQuickSendOpen}>
        <DialogContent className="max-w-lg rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20">
          <DialogHeader className="border-b border-[#e5ede0] pb-4">
            <DialogTitle className="text-[#3d5a36] flex items-center gap-2">
              <Send className="h-5 w-5 text-[#5d8044]" /> Quick Send SMS
            </DialogTitle>
            <DialogDescription className="text-[#556d4a]">
              Send a custom message to workers via the SMS800C modem
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-[#3d5a36] font-bold">Send To</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["all", "batch", "individual"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSendTo(opt); setSelectedWorkerIds([]); setSelectedBatchId(""); }}
                    className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                      sendTo === opt
                        ? "bg-[#5d8044] text-white border-[#5d8044] shadow-md"
                        : "bg-white text-[#556d4a] border-[#d9ead6] hover:border-[#5d8044]"
                    }`}
                  >
                    {opt === "all" ? "📢 All Workers" : opt === "batch" ? "📦 By Batch" : "👤 Individual"}
                  </button>
                ))}
              </div>
            </div>

            {sendTo === "batch" && (
              <div className="space-y-2">
                <Label className="text-[#3d5a36]">Select Batch</Label>
                <select
                  className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6]"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="" disabled>Choose a batch...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {sendTo === "individual" && (
              <div className="space-y-2">
                <Label className="text-[#3d5a36]">Select Worker(s)</Label>
                <div className="max-h-[150px] overflow-y-auto space-y-1 border border-[#d9ead6] rounded-xl p-2 bg-white">
                  {workers.filter(w => w.status === "Active").map((w) => (
                    <label key={w.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f3faf2] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWorkerIds.includes(w.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkerIds([...selectedWorkerIds, w.id]);
                          } else {
                            setSelectedWorkerIds(selectedWorkerIds.filter((id) => id !== w.id));
                          }
                        }}
                        className="rounded border-[#d9ead6]"
                      />
                      <span className="text-sm text-[#3d5a36] font-medium">{w.name}</span>
                      <span className="text-xs text-[#7b8f6f] font-mono">{w.phone}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#7b8f6f]">{selectedWorkerIds.length} worker(s) selected</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[#3d5a36] font-bold">Message</Label>
              <Textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Type your SMS message here... Use {worker_name} to personalize."
                className="min-h-[100px] border-[#d9ead6] bg-white"
              />
              <p className="text-xs text-[#7b8f6f]">{smsMessage.length} / 160 characters</p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSendSms}
                disabled={
                  sendLoading ||
                  !smsMessage.trim() ||
                  (sendTo === "batch" && !selectedBatchId) ||
                  (sendTo === "individual" && selectedWorkerIds.length === 0)
                }
                className="w-full bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20"
              >
                {sendLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Queuing...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send SMS</>
                )}
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
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