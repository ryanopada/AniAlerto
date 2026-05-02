import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Phone, User, Search, Filter, Users, UserCheck, UserX, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Worker {
  id: string;
  name: string;
  phone: string;
  email?: string;
  assignedBatch: string;
  status: "Active" | "Inactive";
  photo?: string;
  address?: string;
  dateJoined?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  skills?: string[];
}

export function WorkerManagement() {
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([
    { 
      id: "W001", 
      name: "Juan Dela Cruz", 
      phone: "+63 912 345 6789", 
      email: "juan.delacruz@email.com",
      assignedBatch: "BR-2026-001", 
      status: "Active",
      photo: "https://images.unsplash.com/photo-1710563849800-73af5bfc9f36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWxpcGlubyUyMGZhcm1lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjcyMzY1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      address: "Barangay San Miguel, Tarlac City, Tarlac",
      dateJoined: "2025-01-15",
      emergencyContact: "Maria Dela Cruz",
      emergencyPhone: "+63 917 123 4567",
      skills: ["Irrigation", "Fertilization", "Pest Control"]
    },
    { 
      id: "W002", 
      name: "Maria Santos", 
      phone: "+63 923 456 7890", 
      email: "maria.santos@email.com",
      assignedBatch: "BR-2026-001", 
      status: "Active",
      photo: "https://images.unsplash.com/photo-1700553856089-1ea9261143a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwZmFybWVyfGVufDF8fHx8MTc3MjcyMzY1NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      address: "Barangay Santa Cruz, Tarlac City, Tarlac",
      dateJoined: "2025-02-01",
      emergencyContact: "Pedro Santos",
      emergencyPhone: "+63 918 234 5678",
      skills: ["Harvesting", "Equipment Operation"]
    },
    { 
      id: "W003", 
      name: "Pedro Reyes", 
      phone: "+63 934 567 8901", 
      email: "pedro.reyes@email.com",
      assignedBatch: "BR-2026-002", 
      status: "Active",
      photo: "https://images.unsplash.com/photo-1609554259810-ad331c1a9519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWxpcGlubyUyMG1hbGUlMjBhZ3JpY3VsdHVyYWwlMjB3b3JrZXJ8ZW58MXx8fHwxNzcyNzIzNjU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      address: "Barangay San Roque, Gerona, Tarlac",
      dateJoined: "2024-11-10",
      emergencyContact: "Ana Reyes",
      emergencyPhone: "+63 919 345 6789",
      skills: ["Pest Control", "Equipment Maintenance"]
    },
    { 
      id: "W004", 
      name: "Ana Garcia", 
      phone: "+63 945 678 9012", 
      email: "ana.garcia@email.com",
      assignedBatch: "BR-2026-002", 
      status: "Active",
      address: "Barangay Poblacion, Paniqui, Tarlac",
      dateJoined: "2025-01-20",
      emergencyContact: "Jose Garcia",
      emergencyPhone: "+63 920 456 7890",
      skills: ["Irrigation", "Harvesting"]
    },
    { 
      id: "W005", 
      name: "Jose Martinez", 
      phone: "+63 956 789 0123", 
      email: "jose.martinez@email.com",
      assignedBatch: "BR-2026-003", 
      status: "Active",
      address: "Barangay Matatalaib, Tarlac City, Tarlac",
      dateJoined: "2024-12-05",
      emergencyContact: "Rosa Martinez",
      emergencyPhone: "+63 921 567 8901",
      skills: ["Fertilization", "Soil Management", "Irrigation"]
    },
    { 
      id: "W006", 
      name: "Rosa Fernandez", 
      phone: "+63 967 890 1234", 
      email: "rosa.fernandez@email.com",
      assignedBatch: "BR-2026-003", 
      status: "Inactive",
      address: "Barangay San Vicente, Tarlac City, Tarlac",
      dateJoined: "2024-10-01",
      emergencyContact: "Luis Fernandez",
      emergencyPhone: "+63 922 678 9012",
      skills: ["Pest Control", "Quality Control"]
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    assignedBatch: "",
    status: "Active" as Worker["status"],
  });

  // Mock batch data for dropdown
  const batches = [
    "BR-2026-001",
    "BR-2026-002",
    "BR-2026-003",
    "BR-2026-004",
  ];

  const handleCreateWorker = () => {
    setEditingWorker(null);
    setFormData({
      name: "",
      phone: "",
      assignedBatch: "",
      status: "Active",
    });
    setIsDialogOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      assignedBatch: worker.assignedBatch,
      status: worker.status,
    });
    setIsDialogOpen(true);
  };

  const handleViewWorker = (worker: Worker) => {
    setViewingWorker(worker);
    setIsProfileDialogOpen(true);
  };

  const handleDeleteWorker = (id: string) => {
    if (confirm("Are you sure you want to delete this worker?")) {
      setWorkers(workers.filter(w => w.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWorker) {
      setWorkers(workers.map(w => 
        w.id === editingWorker.id 
          ? { ...w, ...formData }
          : w
      ));
    } else {
      const newWorker: Worker = {
        id: `W${String(workers.length + 1).padStart(3, '0')}`,
        ...formData,
      };
      setWorkers([...workers, newWorker]);
    }
    
    setIsDialogOpen(false);
  };

  // Filter workers based on search query and status
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = 
      worker.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.assignedBatch.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || worker.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Worker Management</h1>
          <p className="text-gray-600">Register and manage farm workers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8acb88] hover:bg-[#648381]" onClick={handleCreateWorker}>
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWorker ? "Edit Worker" : "Register New Worker"}
              </DialogTitle>
              <DialogDescription>
                {editingWorker 
                  ? "Update the worker information below" 
                  : "Enter the details for the new farm worker"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Worker Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Juan Dela Cruz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g., +63 912 345 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedBatch">Assigned Batch</Label>
                <select
                  id="assignedBatch"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.assignedBatch}
                  onChange={(e) => setFormData({ ...formData, assignedBatch: e.target.value })}
                  required
                >
                  <option value="">Select a batch</option>
                  {batches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Worker["status"] })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-[#8acb88] hover:bg-[#648381]">
                  {editingWorker ? "Update Worker" : "Register Worker"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Worker Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Worker Profile</DialogTitle>
            <DialogDescription>
              Complete profile information for the farm worker
            </DialogDescription>
          </DialogHeader>
          {viewingWorker && (
            <div className="space-y-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-[#8acb88]">
                    {viewingWorker.photo ? (
                      <img 
                        src={viewingWorker.photo} 
                        alt={viewingWorker.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#e4fde1]">
                        <User className="h-16 w-16 text-[#648381]" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-[#575761]">{viewingWorker.name}</h3>
                    <p className="text-sm text-gray-500">Worker ID: {viewingWorker.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={viewingWorker.status === "Active" ? "default" : "secondary"} className="text-sm">
                      {viewingWorker.status}
                    </Badge>
                    <Badge variant="outline" className="text-sm border-[#8acb88] text-[#648381]">
                      {viewingWorker.assignedBatch}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-lg mb-3 text-[#575761]">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <div className="flex items-center gap-2 text-base">
                      <Phone className="h-4 w-4 text-[#648381]" />
                      <span>{viewingWorker.phone}</span>
                    </div>
                  </div>
                  {viewingWorker.email && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                      <p className="text-base">{viewingWorker.email}</p>
                    </div>
                  )}
                </div>
                {viewingWorker.address && (
                  <div className="space-y-1 mt-4">
                    <Label className="text-sm font-medium text-gray-600">Home Address</Label>
                    <p className="text-base">{viewingWorker.address}</p>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              {(viewingWorker.emergencyContact || viewingWorker.emergencyPhone) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 text-[#575761]">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewingWorker.emergencyContact && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Contact Name</Label>
                        <p className="text-base">{viewingWorker.emergencyContact}</p>
                      </div>
                    )}
                    {viewingWorker.emergencyPhone && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Contact Phone</Label>
                        <div className="flex items-center gap-2 text-base">
                          <Phone className="h-4 w-4 text-[#648381]" />
                          <span>{viewingWorker.emergencyPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Employment Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-lg mb-3 text-[#575761]">Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingWorker.dateJoined && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-gray-600">Date Joined</Label>
                      <p className="text-base">
                        {new Date(viewingWorker.dateJoined).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Current Batch Assignment</Label>
                    <Badge variant="outline" className="border-[#8acb88] text-[#648381]">
                      {viewingWorker.assignedBatch}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Skills & Specializations */}
              {viewingWorker.skills && viewingWorker.skills.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-lg mb-3 text-[#575761]">Skills & Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingWorker.skills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        className="bg-[#e4fde1] text-[#648381] border-[#8acb88]"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsProfileDialogOpen(false);
                    handleEditWorker(viewingWorker);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsProfileDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Worker Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Workers */}
        <Card className="border-l-4 border-l-[#8acb88]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workers</p>
                <p className="text-3xl font-bold text-[#575761] mt-2">{workers.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#e4fde1] rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-[#648381]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Workers */}
        <Card className="border-l-4 border-l-[#8acb88]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workers</p>
                <p className="text-3xl font-bold text-[#8acb88] mt-2">
                  {workers.filter(w => w.status === "Active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#e4fde1] rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-[#8acb88]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Workers */}
        <Card className="border-l-4 border-l-gray-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Workers</p>
                <p className="text-3xl font-bold text-gray-500 mt-2">
                  {workers.filter(w => w.status === "Inactive").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <UserX className="h-6 w-6 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Section */}
      <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
        <Card className="border-[#8acb88]">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-[#e4fde1] transition-colors">
              <div className={`flex items-center ${isVisualizationOpen ? 'justify-between' : 'justify-center'}`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-[#8acb88]" />
                  <CardTitle>Worker Analytics & Visualizations</CardTitle>
                </div>
                {isVisualizationOpen ? (
                  <ChevronUp className="h-5 w-5 text-[#648381]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-[#648381]" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Worker Status Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Worker Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: workers.filter(w => w.status === 'Active').length },
                          { name: 'Inactive', value: workers.filter(w => w.status === 'Inactive').length }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#8acb88" />
                        <Cell fill="#648381" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Workers per Batch */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Workers per Batch</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from(new Set(workers.map(w => w.assignedBatch))).map(batch => ({
                        batch,
                        count: workers.filter(w => w.assignedBatch === batch).length
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="batch" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Workers" fill="#8acb88" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Skills Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Top Skills Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(() => {
                        const skillCounts: Record<string, number> = {};
                        workers.forEach(worker => {
                          worker.skills?.forEach(skill => {
                            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                          });
                        });
                        return Object.entries(skillCounts)
                          .map(([skill, count]) => ({ skill, count }))
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 6);
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Workers" fill="#648381" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Worker Join Timeline */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Worker Join Timeline (Last 6 Months)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(() => {
                        const monthCounts: Record<string, number> = {};
                        workers.forEach(worker => {
                          if (worker.dateJoined) {
                            const date = new Date(worker.dateJoined);
                            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
                          }
                        });
                        return Object.entries(monthCounts).map(([month, count]) => ({ month, count }));
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Workers Joined" fill="#ffbf46" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle>Registered Workers</CardTitle>
          <CardDescription>
            Manage farm workers and their assigned batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Worker ID, Name, Phone Number, or Batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 md:w-64">
              <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")}
                className="w-full border rounded-md px-3 py-2 bg-white"
              >
                <option value="All">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredWorkers.length} of {workers.length} worker{workers.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
            {statusFilter !== "All" && ` with ${statusFilter} status`}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Assigned Batch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell 
                      className="font-medium text-[#648381] hover:text-[#8acb88] cursor-pointer underline"
                      onClick={() => handleViewWorker(worker)}
                    >
                      {worker.id}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2 text-[#648381] hover:text-[#8acb88] cursor-pointer"
                        onClick={() => handleViewWorker(worker)}
                      >
                        <User className="h-4 w-4" />
                        <span className="underline">{worker.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {worker.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{worker.assignedBatch}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={worker.status === "Active" ? "default" : "secondary"}>
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditWorker(worker)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteWorker(worker.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredWorkers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <User className="h-12 w-12 text-gray-300" />
                        <p className="font-medium">No workers found</p>
                        <p className="text-sm">
                          {searchQuery || statusFilter !== "All" 
                            ? "Try adjusting your search or filter criteria" 
                            : "Add your first worker to get started"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
