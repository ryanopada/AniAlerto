import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Layers, CheckCircle, Map } from "lucide-react";
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
  
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    plantingDate: "",
    area: "",
    variety: "",
    status: "Active" as const,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-4">
      <motion.div 
        className="flex justify-between items-start"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#3d5a36]">Farm Batch Management</h1>
          <p className="text-[#556d4a]">Managing {batches.length} active batches in SQL</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                className="bg-[#5d8044] hover:bg-[#4a6b36] shadow-lg shadow-[#5d8044]/30 border border-[#7a9b5c] transition-all duration-200" 
                onClick={() => {
                  setEditingBatch(null);
                  setFormData({ name: "", location: "", plantingDate: "", area: "", variety: "", status: "Active", notes: "" });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingBatch ? "Edit Batch" : "New Batch"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div>
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
              </div>
              <Button type="submit" className="w-full bg-[#5d8044] hover:bg-[#4a6b36] shadow-lg shadow-[#5d8044]/30 border border-[#7a9b5c] transition-all duration-200">Save to Database</Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#556d4a]">Total Batches</p>
                <p className="text-3xl font-bold text-[#3d5a36] mt-2">{batches.length}</p>
              </div>
              <div className="p-3 bg-[#5d8044]/10 rounded-full">
                <Layers className="h-6 w-6 text-[#5d8044]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#556d4a]">Active Batches</p>
                <p className="text-3xl font-bold text-[#5d8044] mt-2">
                  {batches.filter(b => b.status === "Active").length}
                </p>
              </div>
              <div className="p-3 bg-[#5d8044]/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-[#5d8044]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#556d4a]">Total Area</p>
                <p className="text-3xl font-bold text-[#ffbf46] mt-2">
                  {calculateTotalArea().toFixed(1)} ha
                </p>
              </div>
              <div className="p-3 bg-[#ffbf46]/10 rounded-full">
                <Map className="h-6 w-6 text-[#ffbf46]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
            <CardTitle className="text-[#3d5a36] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#5d8044]" />
              Active Farm Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#e5ede0]">
                  <TableHead className="text-[#556d4a] font-semibold">Name</TableHead>
                  <TableHead className="text-[#556d4a] font-semibold">Location</TableHead>
                  <TableHead className="text-[#556d4a] font-semibold">Date</TableHead>
                  <TableHead className="text-[#556d4a] font-semibold">Variety</TableHead>
                  <TableHead className="text-[#556d4a] font-semibold">Status</TableHead>
                  <TableHead className="text-[#556d4a] font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[#556d4a]">No batches found in database.</TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch, index) => (
                    <motion.tr 
                      key={batch.id}
                      className="border-b border-[#f0f8eb] hover:bg-[#f8fdf3] transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <TableCell className="font-medium text-[#3d5a36]">{batch.name}</TableCell>
                      <TableCell className="text-[#556d4a]">{batch.location}</TableCell>
                      <TableCell className="text-[#556d4a]">{batch.plantingDate}</TableCell>
                      <TableCell className="text-[#556d4a]">{batch.variety}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#5d8044]/10 text-[#5d8044] border border-[#5d8044]/20 hover:bg-[#5d8044]/20 transition-colors duration-200">{batch.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-[#5d8044] text-[#5d8044] hover:bg-[#5d8044] hover:text-white transition-all duration-200"
                            onClick={() => {
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
                            <Edit className="h-4 w-4" />
                          </Button>
                        </motion.div>
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