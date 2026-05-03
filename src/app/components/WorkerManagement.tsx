import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Search, Users, UserCheck, UserX, ChevronDown, ChevronUp, BarChart3, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";

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

export function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    assignedBatch: "",
    status: "Active" as Worker["status"],
  });

  const WORKER_API_URL = "http://localhost/anialerto-backend/src/workers.php";
  const BATCH_API_URL = "http://localhost/anialerto-backend/src/batches.php";

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
      </motion.div>

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
                      <TableCell className="font-medium text-[#3d5a36]">{worker.name}</TableCell>
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