import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Layers, CheckCircle, Map, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

interface Batch {
  id: string;
  name: string;
  location: string;
  plantingDate: string; 
  area: string;
  variety: string;      
  status: "Active" | "Harvested" | "Planning";
  notes?: string;
}

export function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    plantingDate: "",
    area: "",
    variety: "",
    status: "Active" as Batch["status"],
    notes: ""
  });

  const API_URL = "http://localhost/anialerto-backend/src/batches.php";

  const fetchBatches = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (Array.isArray(data)) {
        const mappedData = data.map((b: any) => ({
          id: b.id,
          name: b.name,            
          location: b.location,     
          plantingDate: b.planting_date,
          area: b.area,        
          variety: b.variety, 
          status: b.status,         
          notes: b.notes            
        }));
        setBatches(mappedData);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      id: editingBatch?.id 
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setIsDialogOpen(false);
        fetchBatches();
      } else {
        console.error("Server error:", result.message);
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const calculateTotalArea = () => {
    return batches.reduce((total, batch) => {
      const areaValue = parseFloat(batch.area);
      return total + (isNaN(areaValue) ? 0 : areaValue);
    }, 0);
  };

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            batch.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            batch.variety.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [batches, searchQuery]);

  const stats = useMemo(() => ({
    total: batches.length,
    active: batches.filter(b => b.status === "Active").length,
    totalArea: calculateTotalArea()
  }), [batches]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Farm Batch Management</h1>
          <p className="text-[#556d4a]">Managing agricultural production batches</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button className="bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]" onClick={() => {
            setEditingBatch(null);
            setFormData({ name: "", location: "", plantingDate: "", area: "", variety: "", status: "Active", notes: "" });
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Batch
          </Button>
        </motion.div>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20">
            <DialogHeader>
              <DialogTitle className="text-[#3d5a36]">{editingBatch ? "Edit Batch" : "Create Batch"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label>Batch Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required />
                </div>
                <div>
                  <Label>Area (ha)</Label>
                  <Input value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} required />
                </div>
              </div>
              <div>
                <Label>Planting Date</Label>
                <Input type="date" value={formData.plantingDate} onChange={(e) => setFormData({...formData, plantingDate: e.target.value})} required />
              </div>
              <div>
                <Label>Corn Variety</Label>
                <Input value={formData.variety} onChange={(e) => setFormData({...formData, variety: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6]" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Active">Active</option>
                  <option value="Harvested">Harvested</option>
                  <option value="Planning">Planning</option>
                </select>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]">Save Batch</Button>
              </motion.div>
            </form>
          </DialogContent>
        </Dialog>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <StatCard title="Total Batches" value={stats.total} icon={<Layers />} color="border-l-[#5d8044]" textColor="text-[#3d5a36]" />
        <StatCard title="Active Batches" value={stats.active} icon={<CheckCircle />} color="border-l-[#5d8044]" textColor="text-[#5d8044]" />
        <StatCard title="Total Area" value={`${stats.totalArea.toFixed(1)} ha`} icon={<Map />} color="border-l-[#ffbf46]" textColor="text-[#ffbf46]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
      >
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
            <div>
              <CardTitle className="text-[#3d5a36]">Farm Batches</CardTitle>
              <CardDescription className="text-[#556d4a]">Manage agricultural production batches</CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
                <Input placeholder="Search..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-[#f3faf2]">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Planting Date</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[#556d4a]">No batches found.</TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch, index) => (
                    <motion.tr
                      key={batch.id}
                      className="hover:bg-[#eff7ed] transition-colors duration-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                    >
                      <TableCell className="font-medium text-[#3d5a36]">{batch.name}</TableCell>
                      <TableCell className="text-[#556d4a]">{batch.location}</TableCell>
                      <TableCell className="text-[#556d4a]">{batch.plantingDate}</TableCell>
                      <TableCell className="text-[#556d4a]">{batch.variety}</TableCell>
                      <TableCell>
                        <Badge className={batch.status === "Active" ? "bg-[#e4fde1] text-[#5d8044]" : "bg-gray-100 text-gray-500"}>
                          {batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="ghost" size="sm" onClick={() => {
                             setEditingBatch(batch);
                             setFormData({
                               name: batch.name,
                               location: batch.location,
                               plantingDate: batch.plantingDate,
                               area: batch.area,
                               variety: batch.variety,
                               status: batch.status,
                               notes: batch.notes || ""
                             });
                             setIsDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 text-[#5d8044]" />
                          </Button>
                        </motion.button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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