import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Send, Eye, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
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

  const getCategoryColor = (category: MessageTemplate["category"]) => {
    switch (category) {
      case "Irrigation": return "bg-blue-100 text-blue-800";
      case "Fertilization": return "bg-green-100 text-green-800";
      case "Pest Control": return "bg-red-100 text-red-800";
      case "Harvest": return "bg-yellow-100 text-yellow-800";
      case "General": return "bg-gray-100 text-gray-800";
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6">
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
                <select id="category" className="w-full border rounded-md px-3 py-2" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as MessageTemplate["category"] })} required>
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
                <Button type="submit" className="bg-[#8acb88] hover:bg-[#648381]">{editingTemplate ? "Update Template" : "Create Template"}</Button>
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

      {/* Moved: Total Templates Stats Row[cite: 3] */}
      <motion.div
        className="grid md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader><CardTitle className="text-lg text-[#3d5a36]">Total Templates</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#5d8044]">{templates.length}</p></CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader><CardTitle className="text-lg text-[#3d5a36]">Active Templates</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#5d8044]">{templates.filter(t => !!t.active).length}</p></CardContent>
        </Card>
        <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader><CardTitle className="text-lg text-[#3d5a36]">Categories</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-[#5d8044]">{new Set(templates.map(t => t.category)).size}</p></CardContent>
        </Card>
      </motion.div>

      {/* Moved: SMS Response Keywords[cite: 3] */}
      <Card className="bg-blue-50">
        <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" />SMS Response Keywords</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg"><p className="font-bold text-green-600 mb-1">DONE</p><p className="text-xs text-gray-600">Task completed successfully</p></div>
            <div className="bg-white p-4 rounded-lg"><p className="font-bold text-yellow-600 mb-1">DELAY</p><p className="text-xs text-gray-600">Task postponed or delayed</p></div>
            <div className="bg-white p-4 rounded-lg"><p className="font-bold text-red-600 mb-1">HELP</p><p className="text-xs text-gray-600">Assistance or guidance needed</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Moved After Stats: Message Analytics & Visualizations[cite: 3] */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
      >
        <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
          <Card className="border border-[#d9ead6] rounded-[1.5rem] overflow-hidden shadow-2xl shadow-[#a4c692]/20 bg-white">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-[#eff7ed] transition-colors p-6">
                <div className={`flex items-center ${isVisualizationOpen ? 'justify-between' : 'justify-center'}`}>
                  <div className="flex items-center gap-2 text-[#3d5a36]"><BarChart3 className="h-6 w-6 text-[#5d8044]" /><CardTitle>Message Analytics & Visualizations</CardTitle></div>
                  {isVisualizationOpen ? <ChevronUp className="h-5 w-5 text-[#5d8044]" /> : <ChevronDown className="h-5 w-5 text-[#5d8044]" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-6 bg-[#f8fdf3]">
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
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      </motion.div>

      {/* Message Templates Table[cite: 3] */}
      <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3]">
        <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
          <CardTitle className="text-[#3d5a36]">Message Templates</CardTitle>
          <CardDescription className="text-[#556d4a]">Manage automated SMS message templates for various farm activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f3faf2]">
                <TableRow>
                  <TableHead className="text-[#556d4a]">ID</TableHead>
                  <TableHead className="text-[#556d4a]">Name</TableHead>
                  <TableHead className="text-[#556d4a]">Category</TableHead>
                  <TableHead className="text-[#556d4a]">Message Preview</TableHead>
                  <TableHead className="text-[#556d4a]">Expected Responses</TableHead>
                  <TableHead className="text-[#556d4a]">Days After Planting</TableHead>
                  <TableHead className="text-[#556d4a]">Status</TableHead>
                  <TableHead className="text-[#556d4a]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template, index) => (
                  <motion.tr
                    key={template.id}
                    className="hover:bg-[#eff7ed] transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.03 }}
                  >
                    <TableCell className="font-medium text-[#3d5a36]">{template.id}</TableCell>
                    <TableCell className="text-[#556d4a]">{template.name}</TableCell>
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
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleViewTemplate(template)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}