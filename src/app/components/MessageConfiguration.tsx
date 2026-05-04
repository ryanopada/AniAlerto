import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Send, Eye, ChevronDown, ChevronUp, BarChart3, Search, MessageSquare, CheckCircle, Hash } from "lucide-react";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";

interface MessageTemplate {
  id: string;
  name: string;
  category: "Irrigation" | "Fertilization" | "Pest Control" | "Harvest" | "General";
  message: string;
  days_after_planting: number;
  active: boolean | number;
  expected_responses?: string[];
  trigger_type?: string;
}

export function MessageConfiguration() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const API_URL = "http://localhost/anialerto-backend/src/message_config.php";

  const [formData, setFormData] = useState({
    name: "",
    category: "General" as MessageTemplate["category"],
    message: "",
    days_after_planting: 0,
    active: true,
    expected_responses: [] as string[],
  });

  const fetchTemplates = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const categories: MessageTemplate["category"][] = ["Irrigation", "Fertilization", "Pest Control", "Harvest", "General"];
  
  const availableResponses = [
    { value: "DONE", label: "DONE - Task completed", color: "text-green-600" },
    { value: "DELAY", label: "DELAY - Task delayed", color: "text-yellow-600" },
    { value: "HELP", label: "HELP - Need assistance", color: "text-red-600" },
    { value: "CANCEL", label: "CANCEL - Task cancelled", color: "text-gray-600" },
    { value: "OK", label: "OK - Acknowledged", color: "text-blue-600" },
  ];

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({ name: "", category: "General", message: "", days_after_planting: 0, active: true, expected_responses: [] });
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message: template.message,
      days_after_planting: template.days_after_planting,
      active: !!template.active,
      expected_responses: template.expected_responses || [],
    });
    setIsDialogOpen(true);
  };

  const handleViewTemplate = (template: MessageTemplate) => {
    setViewingTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Are you sure you want to delete this message template?")) {
      await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      fetchTemplates();
      setIsDialogOpen(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...template, active: !template.active ? 1 : 0 }),
    });
    fetchTemplates();
  };

  const handleToggleResponse = (response: string) => {
    setFormData(prev => ({
      ...prev,
      expected_responses: prev.expected_responses.includes(response)
        ? prev.expected_responses.filter(r => r !== response)
        : [...prev.expected_responses, response]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, id: editingTemplate?.id, active: formData.active ? 1 : 0, trigger_type: "days_after_planting" };
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setIsDialogOpen(false);
    fetchTemplates();
  };

  const stats = useMemo(() => ({
    total: templates.length,
    active: templates.filter(t => !!t.active).length,
    categories: new Set(templates.map(t => t.category)).size
  }), [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [templates, searchQuery]);

  const getResponseColor = (response: string) => {
    switch (response) {
      case "DONE": return "bg-green-100 text-green-800 border-green-300";
      case "DELAY": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "HELP": return "bg-red-100 text-red-800 border-red-300";
      case "CANCEL": return "bg-gray-100 text-gray-800 border-gray-300";
      case "OK": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryColor = (category: MessageTemplate["category"]) => {
    switch (category) {
      case "Irrigation": return "bg-blue-100 text-blue-800";
      case "Fertilization": return "bg-green-100 text-green-800";
      case "Pest Control": return "bg-red-100 text-red-800";
      case "Harvest": return "bg-yellow-100 text-yellow-800";
      case "General": return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold mb-2 text-[#3d5a36]">Advisory Message Configuration</h1>
          <p className="text-[#556d4a]">Configure SMS message templates for farm activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button className="bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]" onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </motion.div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl shadow-[#a4c692]/20">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Message Template" : "Create New Message Template"}</DialogTitle>
              <DialogDescription>{editingTemplate ? "Update the message template below" : "Create a new SMS message template for farm activities"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" placeholder="e.g., First Irrigation Reminder" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select id="category" className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6]" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as MessageTemplate["category"] })} required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea id="message" placeholder="Enter the SMS message content..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} required />
                <p className="text-xs text-gray-500">Character count: {formData.message.length} (SMS limit: 160 characters per message)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="days_after_planting">Days After Planting</Label>
                <Input id="days_after_planting" type="number" min="0" placeholder="e.g., 7" value={formData.days_after_planting} onChange={(e) => setFormData({ ...formData, days_after_planting: parseInt(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>Expected Response Commands</Label>
                <div className="space-y-2">
                  {availableResponses.map((response) => (
                    <div key={response.value} className="flex items-center gap-2">
                      <input type="checkbox" id={`response-${response.value}`} checked={formData.expected_responses.includes(response.value)} onChange={() => handleToggleResponse(response.value)} className="h-4 w-4 rounded border-gray-300" />
                      <Label htmlFor={`response-${response.value}`} className={`cursor-pointer ${response.color}`}>{response.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="active">Active (send this message automatically)</Label>
              </div>
              <div className="flex gap-2 pt-4">
                {editingTemplate && (
                  <Button type="button" variant="destructive" onClick={() => handleDeleteTemplate(editingTemplate.id)} className="mr-auto"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
                )}
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className={editingTemplate ? "" : "ml-auto"}>Cancel</Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button type="submit" className="bg-[#8acb88] hover:bg-[#648381]">{editingTemplate ? "Update Template" : "Create Template"}</Button>
                </motion.div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>View Message Template</DialogTitle></DialogHeader>
          {viewingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-600">Template ID</Label><p className="text-base">{viewingTemplate.id}</p></div>
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-600">Template Name</Label><p className="text-base font-medium">{viewingTemplate.name}</p></div>
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-600">Category</Label><div><span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(viewingTemplate.category)}`}>{viewingTemplate.category}</span></div></div>
              <div className="space-y-2"><Label className="text-sm font-medium text-gray-600">Message Content</Label><p className="text-base bg-gray-50 p-4 rounded-md border">{viewingTemplate.message}</p></div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsViewDialogOpen(false); handleEditTemplate(viewingTemplate); }}><Edit className="h-4 w-4 mr-2" />Edit Template</Button>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <StatCard title="Total Templates" value={stats.total} icon={<MessageSquare />} color="border-l-[#5d8044]" textColor="text-[#3d5a36]" />
        <StatCard title="Active Templates" value={stats.active} icon={<CheckCircle />} color="border-l-[#5d8044]" textColor="text-[#5d8044]" />
        <StatCard title="Categories" value={stats.categories} icon={<Hash />} color="border-l-[#5d8044]" textColor="text-[#556d4a]" />
      </motion.div>

      {/* Moved: Message Analytics & Visualizations[cite: 3] */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen} className="border border-[#d9ead6] rounded-[1.5rem] overflow-hidden shadow-2xl shadow-[#a4c692]/20 bg-white">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex justify-between items-center p-6 hover:bg-[#eff7ed] transition-colors duration-200">
              <div className="flex items-center gap-3 text-[#3d5a36]">
                <BarChart3 className="h-5 w-5 text-[#5d8044]" />
                <span className="font-semibold">Message Analytics</span>
              </div>
              {isVisualizationOpen ? <ChevronUp className="text-[#5d8044]" /> : <ChevronDown className="text-[#5d8044]" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-6 border-t border-[#e5ede0] bg-[#f8fdf3]">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Messages by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categories.map(cat => ({ name: cat, value: templates.filter(t => t.category === cat).length })).filter(d => d.value > 0)} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        <Cell fill="#8acb88" /><Cell fill="#ffbf46" /><Cell fill="#648381" /><Cell fill="#575761" /><Cell fill="#e4fde1" />
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Template Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={[{ name: 'Active', value: templates.filter(t => !!t.active).length }, { name: 'Inactive', value: templates.filter(t => !t.active).length }]} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                        <Cell fill="#8acb88" /><Cell fill="#648381" />
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
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
              <CardTitle className="text-[#3d5a36]">Message Templates</CardTitle>
              <CardDescription className="text-[#556d4a]">Manage automated SMS message templates</CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8f6f]" />
                <Input placeholder="Search..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f3faf2]">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Expected Responses</TableHead>
                  <TableHead>Days After Planting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template, index) => (
                  <motion.tr
                    key={template.id}
                    className="hover:bg-[#eff7ed] transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                  >
                    <TableCell className="font-mono text-xs text-[#556d4a]">{template.id}</TableCell>
                    <TableCell className="font-medium text-[#3d5a36]">{template.name}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>{template.category}</span></TableCell>
                    <TableCell className="max-w-xs"><p className="text-sm text-[#556d4a] truncate">{template.message}</p></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.expected_responses && template.expected_responses.length > 0 ? template.expected_responses.map((response) => (
                          <span key={response} className={`px-2 py-0.5 rounded text-xs font-medium border ${getResponseColor(response)}`}>{response}</span>
                        )) : <span className="text-xs text-[#7b8f6f]">No responses</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[#556d4a]">{template.days_after_planting}</TableCell>
                    <TableCell>
                      <Badge variant={template.active ? "default" : "secondary"} className="cursor-pointer" onClick={() => handleToggleActive(template.id)}>{template.active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button size="sm" variant="outline" onClick={() => handleViewTemplate(template)}><Eye className="h-4 w-4" /></Button>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}><Edit className="h-4 w-4" /></Button>
                        </motion.button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
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