import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Calendar, Layers, CheckCircle, Map, Search, Filter, Users, Eye, MapPin, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Worker {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Inactive";
}

interface Batch {
  id: string;
  name: string;
  location: string;
  plantingDate: string;
  area: string;
  variety: string;
  status: "Active" | "Harvested" | "Planning";
  workers: Worker[];
  harvestDate?: string;
  notes?: string;
}

export function BatchManagement() {
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([
    { 
      id: "BR-2026-001", 
      name: "Field A - Wet Season", 
      location: "Field A", 
      plantingDate: "2026-01-15", 
      area: "2.5 ha", 
      variety: "Pioneer 30G40", 
      status: "Active",
      workers: [
        { id: "W001", name: "Juan Dela Cruz", role: "Field Supervisor", status: "Active" },
        { id: "W003", name: "Pedro Santos", role: "Field Worker", status: "Active" },
        { id: "W005", name: "Ana Reyes", role: "Field Worker", status: "Active" }
      ],
      notes: "Regular monitoring for Fall Armyworm. Irrigation system functioning well."
    },
    { 
      id: "BR-2026-002", 
      name: "Field B - Early Planting", 
      location: "Field B", 
      plantingDate: "2026-02-01", 
      area: "3.0 ha", 
      variety: "Dekalb 9150", 
      status: "Active",
      workers: [
        { id: "W002", name: "Maria Garcia", role: "Agronomist", status: "Active" },
        { id: "W004", name: "Jose Ramirez", role: "Equipment Operator", status: "Active" }
      ],
      notes: "Early planting trial. Monitor growth stages closely."
    },
    { 
      id: "BR-2026-003", 
      name: "Field C - Main Crop", 
      location: "Field C", 
      plantingDate: "2026-02-15", 
      area: "4.0 ha", 
      variety: "NK6410", 
      status: "Active",
      workers: [
        { id: "W001", name: "Juan Dela Cruz", role: "Field Supervisor", status: "Active" },
        { id: "W006", name: "Carlos Mendoza", role: "Field Worker", status: "Active" }
      ],
      notes: "Largest field. Requires additional attention during harvest season."
    },
    { 
      id: "BR-2025-012", 
      name: "Field D - Previous", 
      location: "Field D", 
      plantingDate: "2025-11-10", 
      area: "2.0 ha", 
      variety: "Pioneer 30G40", 
      status: "Harvested",
      harvestDate: "2026-02-20",
      workers: [
        { id: "W007", name: "Luis Torres", role: "Field Worker", status: "Active" }
      ],
      notes: "Successful harvest. Yield was above average. Good soil condition for next season."
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    plantingDate: "",
    area: "",
    variety: "",
    status: "Active" as Batch["status"],
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterPlantingDate, setFilterPlantingDate] = useState("all");
  const [filterVariety, setFilterVariety] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleCreateBatch = () => {
    setEditingBatch(null);
    setFormData({
      name: "",
      location: "",
      plantingDate: "",
      area: "",
      variety: "",
      status: "Active",
    });
    setIsDialogOpen(true);
  };

  const handleViewBatch = (batch: Batch) => {
    setViewingBatch(batch);
    setIsDetailDialogOpen(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      location: batch.location,
      plantingDate: batch.plantingDate,
      area: batch.area,
      variety: batch.variety,
      status: batch.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteBatch = (id: string) => {
    if (confirm("Are you sure you want to delete this batch?")) {
      setBatches(batches.filter(b => b.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBatch) {
      setBatches(batches.map(b => 
        b.id === editingBatch.id 
          ? { ...b, ...formData }
          : b
      ));
    } else {
      const newBatch: Batch = {
        id: `BR-2026-${String(batches.length + 1).padStart(3, '0')}`,
        ...formData,
      };
      setBatches([...batches, newBatch]);
    }
    
    setIsDialogOpen(false);
  };

  const getStatusColor = (status: Batch["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Harvested":
        return "bg-gray-100 text-gray-800";
      case "Planning":
        return "bg-blue-100 text-blue-800";
    }
  };

  // Calculate total area
  const calculateTotalArea = () => {
    return batches.reduce((total, batch) => {
      const areaValue = parseFloat(batch.area.replace(/[^0-9.]/g, ''));
      return total + (isNaN(areaValue) ? 0 : areaValue);
    }, 0);
  };

  // Get unique values for filters
  const uniqueLocations = Array.from(new Set(batches.map(b => b.location)));
  const uniquePlantingDates = Array.from(new Set(batches.map(b => b.plantingDate))).sort();
  const uniqueVarieties = Array.from(new Set(batches.map(b => b.variety)));

  // Filter batches based on search and filters
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = filterLocation === "all" || batch.location === filterLocation;
    const matchesPlantingDate = filterPlantingDate === "all" || batch.plantingDate === filterPlantingDate;
    const matchesVariety = filterVariety === "all" || batch.variety === filterVariety;
    const matchesStatus = filterStatus === "all" || batch.status === filterStatus;

    return matchesSearch && matchesLocation && matchesPlantingDate && matchesVariety && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Farm Batch Management</h1>
          <p className="text-gray-600">Create and manage corn farm batches</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8acb88] hover:bg-[#648381]" onClick={handleCreateBatch}>
              <Plus className="h-4 w-4 mr-2" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBatch ? "Edit Farm Batch" : "Create New Farm Batch"}
              </DialogTitle>
              <DialogDescription>
                {editingBatch 
                  ? "Update the batch information below" 
                  : "Enter the details for the new farm batch"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Field A - Wet Season"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Field A"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plantingDate">Planting Date</Label>
                <Input
                  id="plantingDate"
                  type="date"
                  value={formData.plantingDate}
                  onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  placeholder="e.g., 2.5 ha"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="variety">Corn Variety</Label>
                <Input
                  id="variety"
                  placeholder="e.g., Pioneer 30G40"
                  value={formData.variety}
                  onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Batch["status"] })}
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Harvested">Harvested</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-[#8acb88] hover:bg-[#648381]">
                  {editingBatch ? "Update Batch" : "Create Batch"}
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

      {/* Batch Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Batches */}
        <Card className="border-l-4 border-l-[#8acb88]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-3xl font-bold text-[#575761] mt-2">{batches.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#e4fde1] rounded-full flex items-center justify-center">
                <Layers className="h-6 w-6 text-[#648381]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Batches */}
        <Card className="border-l-4 border-l-[#8acb88]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <p className="text-3xl font-bold text-[#8acb88] mt-2">
                  {batches.filter(b => b.status === "Active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#e4fde1] rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-[#8acb88]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Area */}
        <Card className="border-l-4 border-l-[#ffbf46]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Area</p>
                <p className="text-3xl font-bold text-[#ffbf46] mt-2">
                  {calculateTotalArea().toFixed(1)} ha
                </p>
              </div>
              <div className="w-12 h-12 bg-[#fff8e7] rounded-full flex items-center justify-center">
                <Map className="h-6 w-6 text-[#ffbf46]" />
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
                  <CardTitle>Batch Analytics & Visualizations</CardTitle>
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
                {/* Batch Status Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Batch Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: batches.filter(b => b.status === 'Active').length },
                          { name: 'Planning', value: batches.filter(b => b.status === 'Planning').length },
                          { name: 'Harvested', value: batches.filter(b => b.status === 'Harvested').length }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell key="batch-pie-active" fill="#8acb88" />
                        <Cell key="batch-pie-planning" fill="#ffbf46" />
                        <Cell key="batch-pie-harvested" fill="#648381" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Batches by Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Batches by Location</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from(new Set(batches.map(b => b.location))).map(location => ({
                        location,
                        count: batches.filter(b => b.location === location).length
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Batches" fill="#8acb88" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Variety Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Corn Variety Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from(new Set(batches.map(b => b.variety))).map(variety => ({
                        variety,
                        count: batches.filter(b => b.variety === variety).length
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="variety" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Batches" fill="#648381" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Worker Assignment Overview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Worker Assignment Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={batches.map(batch => ({
                        batch: batch.id,
                        workers: batch.workers?.length || 0
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="batch" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="workers" name="Workers Assigned" fill="#ffbf46" />
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
          <CardTitle>Active Farm Batches</CardTitle>
          <CardDescription>
            Manage all corn farm batches with planting dates and locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Section */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by Batch ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-[#8acb88] focus:ring-[#8acb88]"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Location Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="pl-10 border-[#8acb88]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Planting Date Filter */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={filterPlantingDate} onValueChange={setFilterPlantingDate}>
                  <SelectTrigger className="pl-10 border-[#8acb88]">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {uniquePlantingDates.map(date => (
                      <SelectItem key={date} value={date}>{date}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Variety Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={filterVariety} onValueChange={setFilterVariety}>
                  <SelectTrigger className="pl-10 border-[#8acb88]">
                    <SelectValue placeholder="All Varieties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Varieties</SelectItem>
                    {uniqueVarieties.map(variety => (
                      <SelectItem key={variety} value={variety}>{variety}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="pl-10 border-[#8acb88]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Harvested">Harvested</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Summary */}
            {(searchTerm || filterLocation !== "all" || filterPlantingDate !== "all" || filterVariety !== "all" || filterStatus !== "all") && (
              <div className="flex items-center justify-between py-2 px-3 bg-[#e4fde1] rounded-md">
                <p className="text-sm text-[#575761]">
                  Showing <span className="font-semibold">{filteredBatches.length}</span> of <span className="font-semibold">{batches.length}</span> batches
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterLocation("all");
                    setFilterPlantingDate("all");
                    setFilterVariety("all");
                    setFilterStatus("all");
                  }}
                  className="text-[#648381] hover:text-[#575761] hover:bg-[#8acb88]/20"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Planting Date</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Search className="h-12 w-12 mb-3 text-gray-300" />
                        <p className="text-lg font-medium mb-1">No batches found</p>
                        <p className="text-sm">Try adjusting your search or filter criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                    <TableCell 
                      className="font-medium text-[#648381] hover:text-[#8acb88] cursor-pointer underline"
                      onClick={() => handleViewBatch(batch)}
                    >
                      {batch.id}
                    </TableCell>
                    <TableCell 
                      className="text-[#648381] hover:text-[#8acb88] cursor-pointer"
                      onClick={() => handleViewBatch(batch)}
                    >
                      {batch.name}
                    </TableCell>
                    <TableCell>{batch.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(batch.plantingDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{batch.area}</TableCell>
                    <TableCell>{batch.variety}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditBatch(batch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Detail View Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingBatch && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  <Eye className="h-6 w-6 text-[#8acb88]" />
                  Batch Details
                </DialogTitle>
                <DialogDescription>
                  Complete information for {viewingBatch.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Basic Information Card */}
                <Card className="border-[#8acb88]">
                  <CardHeader className="bg-[#e4fde1]">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5 text-[#8acb88]" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Batch ID</p>
                        <p className="font-semibold text-[#575761]">{viewingBatch.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Batch Name</p>
                        <p className="font-semibold text-[#575761]">{viewingBatch.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Location</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#8acb88]" />
                          <p className="font-semibold text-[#575761]">{viewingBatch.location}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Area</p>
                        <p className="font-semibold text-[#575761]">{viewingBatch.area}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Corn Variety</p>
                        <p className="font-semibold text-[#575761]">{viewingBatch.variety}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <Badge className={getStatusColor(viewingBatch.status)}>
                          {viewingBatch.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dates Card */}
                <Card className="border-[#8acb88]">
                  <CardHeader className="bg-[#e4fde1]">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#8acb88]" />
                      Important Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Planting Date</p>
                        <p className="font-semibold text-[#575761]">
                          {new Date(viewingBatch.plantingDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      {viewingBatch.harvestDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Harvest Date</p>
                          <p className="font-semibold text-[#575761]">
                            {new Date(viewingBatch.harvestDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Workers Card */}
                <Card className="border-[#8acb88]">
                  <CardHeader className="bg-[#e4fde1]">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#8acb88]" />
                      Assigned Workers ({viewingBatch.workers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {viewingBatch.workers.length > 0 ? (
                      <div className="space-y-3">
                        {viewingBatch.workers.map((worker) => (
                          <div 
                            key={worker.id} 
                            className="flex items-center justify-between p-3 bg-[#e4fde1] rounded-lg hover:bg-[#8acb88]/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#8acb88] rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#575761]">{worker.name}</p>
                                <p className="text-sm text-gray-600">{worker.role}</p>
                              </div>
                            </div>
                            <Badge 
                              className={
                                worker.status === "Active" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {worker.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No workers assigned to this batch yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes Card */}
                {viewingBatch.notes && (
                  <Card className="border-[#8acb88]">
                    <CardHeader className="bg-[#e4fde1]">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#8acb88]" />
                        Notes & Observations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-[#575761] leading-relaxed">{viewingBatch.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  className="bg-[#8acb88] hover:bg-[#648381]"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    handleEditBatch(viewingBatch);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Batch
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
