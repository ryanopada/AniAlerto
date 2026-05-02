import { useState } from "react";
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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface MessageTemplate {
  id: string;
  name: string;
  category: "Irrigation" | "Fertilization" | "Pest Control" | "Harvest" | "General";
  message: string;
  daysAfterPlanting: number;
  active: boolean;
  expectedResponses?: string[];
}

export function MessageConfiguration() {
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: "MSG001",
      name: "First Irrigation Reminder",
      category: "Irrigation",
      message: "Reminder: Perform irrigation check today. Ensure adequate soil moisture. Reply DONE when complete.",
      daysAfterPlanting: 7,
      active: true,
      expectedResponses: ["DONE", "DELAY"],
    },
    {
      id: "MSG002",
      name: "Basal Fertilizer Application",
      category: "Fertilization",
      message: "Apply basal fertilizer today (14-14-14, 2-3 bags/ha). Mix with soil 5-7cm from plants. Reply DONE or DELAY.",
      daysAfterPlanting: 0,
      active: true,
      expectedResponses: ["DONE", "DELAY"],
    },
    {
      id: "MSG003",
      name: "First Side Dressing",
      category: "Fertilization",
      message: "Time for first side dressing! Apply Urea (2 bags/ha) beside plants. Incorporate and irrigate. Reply DONE when finished.",
      daysAfterPlanting: 23,
      active: true,
      expectedResponses: ["DONE", "DELAY"],
    },
    {
      id: "MSG004",
      name: "Pest Monitoring Check",
      category: "Pest Control",
      message: "Conduct pest monitoring today. Check for corn borer and armyworm. Report findings or reply HELP if assistance needed.",
      daysAfterPlanting: 30,
      active: true,
      expectedResponses: ["DONE", "HELP"],
    },
    {
      id: "MSG005",
      name: "Second Side Dressing",
      category: "Fertilization",
      message: "Apply second side dressing today! Urea (2 bags/ha) between rows. Hill up soil around plants. Reply DONE when complete.",
      daysAfterPlanting: 42,
      active: true,
      expectedResponses: ["DONE", "DELAY"],
    },
    {
      id: "MSG006",
      name: "Pre-Harvest Preparation",
      category: "Harvest",
      message: "Prepare for harvest in 2 weeks. Check kernel maturity and moisture. Stop irrigation. Reply DONE to confirm.",
      daysAfterPlanting: 90,
      active: true,
      expectedResponses: ["DONE"],
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "General" as MessageTemplate["category"],
    message: "",
    daysAfterPlanting: 0,
    active: true,
    expectedResponses: [] as string[],
  });

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
    setFormData({
      name: "",
      category: "General",
      message: "",
      daysAfterPlanting: 0,
      active: true,
      expectedResponses: [],
    });
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message: template.message,
      daysAfterPlanting: template.daysAfterPlanting,
      active: template.active,
      expectedResponses: template.expectedResponses || [],
    });
    setIsDialogOpen(true);
  };

  const handleViewTemplate = (template: MessageTemplate) => {
    setViewingTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this message template?")) {
      setTemplates(templates.filter(t => t.id !== id));
      setIsDialogOpen(false);
    }
  };

  const handleToggleActive = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, active: !t.active } : t
    ));
  };

  const handleToggleResponse = (response: string) => {
    setFormData(prev => ({
      ...prev,
      expectedResponses: prev.expectedResponses.includes(response)
        ? prev.expectedResponses.filter(r => r !== response)
        : [...prev.expectedResponses, response]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData }
          : t
      ));
    } else {
      const newTemplate: MessageTemplate = {
        id: `MSG${String(templates.length + 1).padStart(3, '0')}`,
        ...formData,
      };
      setTemplates([...templates, newTemplate]);
    }
    
    setIsDialogOpen(false);
  };

  const getCategoryColor = (category: MessageTemplate["category"]) => {
    switch (category) {
      case "Irrigation":
        return "bg-blue-100 text-blue-800";
      case "Fertilization":
        return "bg-green-100 text-green-800";
      case "Pest Control":
        return "bg-red-100 text-red-800";
      case "Harvest":
        return "bg-yellow-100 text-yellow-800";
      case "General":
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResponseColor = (response: string) => {
    switch (response) {
      case "DONE":
        return "bg-green-100 text-green-800 border-green-300";
      case "DELAY":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "HELP":
        return "bg-red-100 text-red-800 border-red-300";
      case "CANCEL":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "OK":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advisory Message Configuration</h1>
          <p className="text-gray-600">Configure SMS message templates for farm activities</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#8acb88] hover:bg-[#648381]" onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Edit Message Template" : "Create New Message Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? "Update the message template below" 
                  : "Create a new SMS message template for farm activities"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., First Irrigation Reminder"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MessageTemplate["category"] })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  placeholder="Enter the SMS message content..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500">
                  Character count: {formData.message.length} (SMS limit: 160 characters per message)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daysAfterPlanting">Days After Planting</Label>
                <Input
                  id="daysAfterPlanting"
                  type="number"
                  min="0"
                  placeholder="e.g., 7"
                  value={formData.daysAfterPlanting}
                  onChange={(e) => setFormData({ ...formData, daysAfterPlanting: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Message will be sent this many days after the planting date
                </p>
              </div>

              <div className="space-y-2">
                <Label>Expected Response Commands</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Select which responses workers can use for this message
                </p>
                <div className="space-y-2">
                  {availableResponses.map((response) => (
                    <div key={response.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`response-${response.value}`}
                        checked={formData.expectedResponses.includes(response.value)}
                        onChange={() => handleToggleResponse(response.value)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label 
                        htmlFor={`response-${response.value}`} 
                        className={`cursor-pointer ${response.color}`}
                      >
                        {response.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="active">Active (send this message automatically)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                {editingTemplate && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => handleDeleteTemplate(editingTemplate.id)}
                    className="mr-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className={editingTemplate ? "" : "ml-auto"}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#8acb88] hover:bg-[#648381]">
                  {editingTemplate ? "Update Template" : "Create Template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Template Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Message Template</DialogTitle>
            <DialogDescription>
              Complete details of the message template
            </DialogDescription>
          </DialogHeader>
          {viewingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Template ID</Label>
                <p className="text-base">{viewingTemplate.id}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Template Name</Label>
                <p className="text-base font-medium">{viewingTemplate.name}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Category</Label>
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(viewingTemplate.category)}`}>
                    {viewingTemplate.category}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Message Content</Label>
                <p className="text-base bg-gray-50 p-4 rounded-md border">
                  {viewingTemplate.message}
                </p>
                <p className="text-xs text-gray-500">
                  Character count: {viewingTemplate.message.length}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Days After Planting</Label>
                <p className="text-base">{viewingTemplate.daysAfterPlanting} days</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Expected Response Commands</Label>
                <div className="flex flex-wrap gap-2">
                  {viewingTemplate.expectedResponses && viewingTemplate.expectedResponses.length > 0 ? (
                    viewingTemplate.expectedResponses.map((response) => (
                      <span
                        key={response}
                        className={`px-3 py-1 rounded text-sm font-medium border ${getResponseColor(response)}`}
                      >
                        {response}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No expected responses configured</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div>
                  <Badge variant={viewingTemplate.active ? "default" : "secondary"}>
                    {viewingTemplate.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditTemplate(viewingTemplate);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Visualizations Section */}
      <Collapsible open={isVisualizationOpen} onOpenChange={setIsVisualizationOpen}>
        <Card className="border-[#8acb88]">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-[#e4fde1] transition-colors">
              <div className={`flex items-center ${isVisualizationOpen ? 'justify-between' : 'justify-center'}`}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-[#8acb88]" />
                  <CardTitle>Message Analytics & Visualizations</CardTitle>
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
                {/* Message Category Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Messages by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Irrigation', value: templates.filter(t => t.category === 'Irrigation').length },
                          { name: 'Fertilization', value: templates.filter(t => t.category === 'Fertilization').length },
                          { name: 'Pest Control', value: templates.filter(t => t.category === 'Pest Control').length },
                          { name: 'Harvest', value: templates.filter(t => t.category === 'Harvest').length },
                          { name: 'General', value: templates.filter(t => t.category === 'General').length }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#8acb88" />
                        <Cell fill="#ffbf46" />
                        <Cell fill="#648381" />
                        <Cell fill="#575761" />
                        <Cell fill="#e4fde1" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Active vs Inactive Templates */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Template Status</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Active', value: templates.filter(t => t.active).length },
                          { name: 'Inactive', value: templates.filter(t => !t.active).length }
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

                {/* Message Timing Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Message Timing (Days After Planting)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={templates
                        .sort((a, b) => a.daysAfterPlanting - b.daysAfterPlanting)
                        .map((t, idx) => ({
                          day: t.daysAfterPlanting,
                          messages: templates.filter(tm => tm.daysAfterPlanting <= t.daysAfterPlanting).length,
                          name: t.name.substring(0, 15) + '...'
                        }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" label={{ value: 'Days After Planting', position: 'insideBottom', offset: -5 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="messages" name="Cumulative Messages" stroke="#8acb88" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Messages by Category (Bar) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Category Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { category: 'Irrigation', count: templates.filter(t => t.category === 'Irrigation').length },
                        { category: 'Fertilization', count: templates.filter(t => t.category === 'Fertilization').length },
                        { category: 'Pest Control', count: templates.filter(t => t.category === 'Pest Control').length },
                        { category: 'Harvest', count: templates.filter(t => t.category === 'Harvest').length },
                        { category: 'General', count: templates.filter(t => t.category === 'General').length }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Templates" fill="#648381" />
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
          <CardTitle>Message Templates</CardTitle>
          <CardDescription>
            Manage automated SMS message templates for various farm activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Expected Responses</TableHead>
                  <TableHead>Days After Planting</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.id}</TableCell>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-gray-600 truncate">
                        {template.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {template.expectedResponses && template.expectedResponses.length > 0 ? (
                          template.expectedResponses.map((response) => (
                            <span
                              key={response}
                              className={`px-2 py-0.5 rounded text-xs font-medium border ${getResponseColor(response)}`}
                            >
                              {response}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No responses</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{template.daysAfterPlanting}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={template.active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(template.id)}
                      >
                        {template.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{templates.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {templates.filter(t => t.active).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {new Set(templates.map(t => t.category)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sample Message Preview */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            SMS Response Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Workers can respond to task messages using these simple keywords:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-bold text-green-600 mb-1">DONE</p>
              <p className="text-xs text-gray-600">Task completed successfully</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-bold text-yellow-600 mb-1">DELAY</p>
              <p className="text-xs text-gray-600">Task postponed or delayed</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-bold text-red-600 mb-1">HELP</p>
              <p className="text-xs text-gray-600">Assistance or guidance needed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
