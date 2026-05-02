import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Layers, CheckCircle, Map } from "lucide-react";
import { Badge } from "./ui/badge";

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
  
  // Form State
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
          name: b.name,             // Matches 'name' column
          location: b.location,     // Matches 'location' column
          plantingDate: b.planting_date, // Matches 'planting_date' column
          area: b.area,             // Matches 'area' column
          variety: b.variety,       // Matches 'variety' column
          status: b.status,         // Matches 'status' column
          notes: b.notes            // Matches 'notes' column
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

  // SUBMIT DATA (Fixed with async)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure payload matches what your batches.php expects
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
        fetchBatches(); // Refresh table
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
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Farm Batch Management</h1>
          <p className="text-gray-600">Managing {batches.length} active batches in SQL</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8acb88] hover:bg-[#648381]" onClick={() => {
              setEditingBatch(null);
              setFormData({ name: "", location: "", plantingDate: "", area: "", variety: "", status: "Active", notes: "" });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
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
              <Button type="submit" className="w-full bg-[#8acb88] hover:bg-[#648381]">Save to Database</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-[#8acb88]">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Batches</p>
              <p className="text-3xl font-bold text-[#575761] mt-2">{batches.length}</p>
            </div>
            <Layers className="h-6 w-6 text-[#648381]" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#8acb88]">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Batches</p>
              <p className="text-3xl font-bold text-[#8acb88] mt-2">
                {batches.filter(b => b.status === "Active").length}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-[#8acb88]" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#ffbf46]">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Area</p>
              <p className="text-3xl font-bold text-[#ffbf46] mt-2">
                {calculateTotalArea().toFixed(1)} ha
              </p>
            </div>
            <Map className="h-6 w-6 text-[#ffbf46]" />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Farm Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500">No batches found in database.</TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>{batch.location}</TableCell>
                    <TableCell>{batch.plantingDate}</TableCell>
                    <TableCell>{batch.variety}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">{batch.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => {
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
                      }}><Edit className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}