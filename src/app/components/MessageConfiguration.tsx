import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Clock, Eye, ChevronDown, ChevronUp, BarChart3, Search, MessageSquare, CheckCircle, Hash, Layers, FlaskConical, ShieldCheck, AlertTriangle, CalendarClock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface MessageTemplate {
  id: string;
  name: string;
  category: "First Plowing" | "Harrowing" | "Plant Date / Planting" | "Irrigation / Patubig" | "Pesticide Spray / Pang-uod" | "Herbicide Spray / Pang-damo" | "Fertilizer / Abono 1" | "Fertilizer / Abono 2 / Last Dressing" | "Harvest Readiness" | "Irrigation" | "Fertilization" | "Pest Control" | "Harvest" | "General";
  message: string;
  days_after_planting: number;
  active: boolean | number;
  is_test?: number;
  queued_at?: string | null;
  expected_responses?: string[];
  trigger_type?: string;
  batch_id?: string | null;
  batch_name?: string | null;
  scheduled_time?: string;
  plant_date?: string | null;
  scheduled_send_datetime?: string | null;
}

interface ScheduledMessage {
  id: string;
  name: string;
  category: string;
  message: string;
  scheduled_send_datetime: string;
  active: number;
  is_test: number;
  queued_at: string | null;
  batch_id: string | null;
  batch_name: string | null;
  queued_count: number;
  sent_count: number;
}

interface Batch {
  id: string;
  name: string;
  status: string;
  planting_date?: string;
}

export function MessageConfiguration() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [managerAction, setManagerAction] = useState<string | null>(null);

  const API_URL = (import.meta.env.VITE_API_URL || "https://lightpink-cattle-667968.hostingersite.com") + "/api/message_config.php";
  const BATCHES_URL = (import.meta.env.VITE_API_URL || "https://lightpink-cattle-667968.hostingersite.com") + "/api/batches.php";
  const MANAGE_URL = (import.meta.env.VITE_API_URL || "https://lightpink-cattle-667968.hostingersite.com") + "/api/manage_scheduled.php";

  const emptyForm = {
    name: "",
    category: "First Plowing" as MessageTemplate["category"],
    message: "",
    days_after_planting: 0,
    active: true,
    expected_responses: [] as string[],
    batch_id: "" as string,
    scheduled_time: "06:00",
    plant_date: "",
    scheduled_send_datetime: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const mappedData = data.map((t: any) => ({
        ...t,
        scheduled_send_datetime: t.scheduled_send_datetime ? t.scheduled_send_datetime.replace(' ', 'T') : t.scheduled_send_datetime
      }));
      setTemplates(mappedData);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const fetchScheduledMessages = async () => {
    try {
      const res = await fetch(MANAGE_URL);
      const data = await res.json();
      const mappedData = Array.isArray(data) ? data.map((m: any) => ({
        ...m,
        scheduled_send_datetime: m.scheduled_send_datetime ? m.scheduled_send_datetime.replace(' ', 'T') : m.scheduled_send_datetime
      })) : [];
      setScheduledMessages(mappedData);
    } catch (e) {
      console.error("Error fetching scheduled messages:", e);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch(BATCHES_URL);
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching batches:", e);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchBatches();
    fetchScheduledMessages();
  }, []);

  const categories: MessageTemplate["category"][] = [
    "First Plowing",
    "Harrowing",
    "Plant Date / Planting",
    "Irrigation / Patubig",
    "Fertilizer / Abono 1",
    "Fertilizer / Abono 2 / Last Dressing",
    "Harvest Readiness",
  ];

  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateTemplate = () => {
    setFormError(null);
    setEditingTemplate(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setFormError(null);
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      message: template.message,
      days_after_planting: template.days_after_planting,
      active: !!template.active,
      expected_responses: template.expected_responses || [],
      batch_id: template.batch_id ?? "",
      scheduled_time: template.scheduled_time ?? "06:00",
      plant_date: template.plant_date || "",
      scheduled_send_datetime: template.scheduled_send_datetime ? template.scheduled_send_datetime.replace(' ', 'T') : "",
    });
    setIsDialogOpen(true);
  };

  const getDaysOffset = (cat: string): number => {
    switch (cat) {
      case "First Plowing": return -14;
      case "Harrowing": return -7;
      case "Plant Date / Planting": return 0;
      case "Irrigation / Patubig": return 8;
      case "Pesticide Spray / Pang-uod": return 15;
      case "Herbicide Spray / Pang-damo": return 20;
      case "Fertilizer / Abono 1": return 15;
      case "Fertilizer / Abono 2 / Last Dressing": return 40;
      case "Harvest Readiness": return 120;
      default: return 0;
    }
  };

  const computeScheduledDate = (plantDate: string | null, daysOffset: number, timeStr: string): string => {
    if (!plantDate) return "";
    let p = new Date(plantDate.replace(' ', 'T')); // Safari safe parsing
    if (isNaN(p.getTime())) p = new Date(plantDate); // Fallback
    if (isNaN(p.getTime())) return "";

    const offset = Number(daysOffset);
    if (!isNaN(offset)) {
      p.setDate(p.getDate() + offset);
    }

    if (timeStr) {
      const [hh, mm] = timeStr.split(':');
      const h = parseInt(hh, 10);
      const m = parseInt(mm, 10);
      if (!isNaN(h) && !isNaN(m)) {
        p.setHours(h, m, 0, 0);
      } else {
        p.setHours(7, 0, 0, 0);
      }
    } else {
      p.setHours(7, 0, 0, 0);
    }

    if (isNaN(p.getTime())) return "";

    const year = p.getFullYear();
    const month = String(p.getMonth() + 1).padStart(2, '0');
    const day = String(p.getDate()).padStart(2, '0');
    const hour = String(p.getHours()).padStart(2, '0');
    const min = String(p.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${min}:00`;
  };

  const handleBatchChange = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    const plantDate = batch?.planting_date || "";
    const daysOffset = formData.days_after_planting;
    const newDate = computeScheduledDate(plantDate, daysOffset, formData.scheduled_time || "07:00");
    setFormData(prev => ({
      ...prev,
      batch_id: batchId,
      plant_date: plantDate,
      scheduled_send_datetime: newDate
    }));
  };

  const handleCategoryChange = (cat: MessageTemplate["category"]) => {
    const daysOffset = getDaysOffset(cat);
    const newDate = computeScheduledDate(formData.plant_date, daysOffset, formData.scheduled_time || "07:00");
    setFormData(prev => ({
      ...prev,
      category: cat,
      scheduled_send_datetime: newDate,
      days_after_planting: daysOffset
    }));
  };

  const handleTimeChange = (timeStr: string) => {
    const newDate = computeScheduledDate(formData.plant_date, formData.days_after_planting, timeStr);
    setFormData(prev => ({
      ...prev,
      scheduled_time: timeStr,
      scheduled_send_datetime: newDate
    }));
  };

  const daysCalc = formData.days_after_planting;

  const handleViewTemplate = (template: MessageTemplate) => {
    setViewingTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Are you sure you want to delete this message template?")) {
      await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      fetchTemplates();
      fetchScheduledMessages();
      setIsDialogOpen(false);
    }
  };

  // ── Scheduled Message Manager actions ────────────────────────────────────
  const handleManagerDelete = async (id: string) => {
    if (!confirm("Permanently delete this scheduled message template? Any pending queue entries will be cancelled.")) return;
    setManagerAction(id + '-del');
    await fetch(`${MANAGE_URL}?id=${id}`, { method: 'DELETE' });
    await Promise.all([fetchTemplates(), fetchScheduledMessages()]);
    setManagerAction(null);
  };

  const handleManagerMarkSent = async (id: string) => {
    if (!confirm("Mark this scheduled message as already sent? It will be deactivated and the scheduler will skip it.")) return;
    setManagerAction(id + '-sent');
    await fetch(MANAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'mark_sent' }),
    });
    await Promise.all([fetchTemplates(), fetchScheduledMessages()]);
    setManagerAction(null);
  };

  const handleManagerToggleTest = async (id: string) => {
    setManagerAction(id + '-test');
    await fetch(MANAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle_test' }),
    });
    await Promise.all([fetchTemplates(), fetchScheduledMessages()]);
    setManagerAction(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.name.trim() || !formData.message.trim()) {
      setFormError("Template Name and Message cannot be empty.");
      return;
    }

    if (!formData.batch_id) {
      setFormError("Target Batch is required.");
      return;
    }

    const computedDays = daysCalc ?? formData.days_after_planting;
    if (isNaN(computedDays) || computedDays < 0) {
      setFormError("Trigger days must be a positive number.");
      return;
    }

    const payload = {
      ...formData,
      id: editingTemplate?.id,
      active: formData.active ? 1 : 0,
      trigger_type: "days_after_planting",
      batch_id: formData.batch_id || null,
      scheduled_time: formData.scheduled_time || "07:00",
      days_after_planting: computedDays,
      plant_date: formData.plant_date || null,
      scheduled_send_datetime: formData.scheduled_send_datetime || null,
    };
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.status !== "error") {
        setIsDialogOpen(false);
        fetchTemplates();
        fetchScheduledMessages();
      } else {
        setFormError(result.message || result.error || "Server error.");
      }
    } catch (err) {
      console.error(err);
      setFormError("An unexpected error occurred.");
    }
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
      case "PEST": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryColor = (category: MessageTemplate["category"]) => {
    switch (category) {
      case "First Plowing": return "bg-gray-100 text-gray-800";
      case "Harrowing": return "bg-slate-100 text-slate-800";
      case "Plant Date / Planting": return "bg-lime-100 text-lime-800";
      case "Irrigation / Patubig": return "bg-blue-100 text-blue-800";
      case "Pesticide Spray / Pang-uod": return "bg-red-100 text-red-800";
      case "Herbicide Spray / Pang-damo": return "bg-orange-100 text-orange-800";
      case "Fertilizer / Abono 1": return "bg-green-100 text-green-800";
      case "Fertilizer / Abono 2 / Last Dressing": return "bg-emerald-100 text-emerald-800";
      case "Harvest Readiness": return "bg-yellow-100 text-yellow-800";
      case "Irrigation": return "bg-blue-100 text-blue-800";
      case "Fertilization": return "bg-green-100 text-green-800";
      case "Pest Control": return "bg-red-100 text-red-800";
      case "Harvest": return "bg-yellow-100 text-yellow-800";
      case "General": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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
              <DialogTitle className="text-[#3d5a36] text-xl font-bold">{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" placeholder="e.g., First Irrigation Reminder" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              {/* Target Batch */}
              <div className="space-y-2">
                <Label htmlFor="batch_id" className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#5d8044]" />
                  Target Batch <span className="text-red-500">*</span>
                </Label>
                <select
                  id="batch_id"
                  className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6] text-[#3d5a36]"
                  value={formData.batch_id}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  required
                >
                  <option value="" disabled>— Select Target Batch —</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}{b.status !== 'Active' ? ` (${b.status})` : ''}</option>
                  ))}
                </select>
                {formData.plant_date && (
                  <p className="text-xs text-[#5d8044] bg-[#eff7ec] p-2 rounded-md mt-1 inline-block border border-[#d9ead6]">
                    <span className="font-semibold">Plant Date:</span> {formData.plant_date}
                  </p>
                )}
              </div>

              {/* Category / Rule */}
              <div className="space-y-2">
                <Label htmlFor="category">Category (Crop Rule)</Label>
                <select
                  id="category"
                  className="w-full border rounded-xl p-3 bg-white shadow-sm border-[#d9ead6]"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value as MessageTemplate["category"])}
                  required
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Scheduled Send Date & Time computation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#5d8044]" />
                    Scheduled Send Date
                  </Label>
                  <div className="w-full border rounded-xl p-3 bg-gray-50 border-[#d9ead6] text-gray-600">
                    {formData.scheduled_send_datetime ? new Date(formData.scheduled_send_datetime).toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                  </div>
                  {formData.plant_date && (
                    <p className="text-xs text-[#5d8044] font-medium">
                      Rule: {daysCalc === 0 ? "Day 0 (Plant Date)" : daysCalc < 0 ? `${Math.abs(daysCalc)} days before plant date` : `${daysCalc} days after plant date`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#5d8044]" />
                    Send Time
                  </Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time || "07:00"}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="border-[#d9ead6] text-[#3d5a36] p-3 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="message">Message Content <span className="text-red-500">*</span></Label>
                <Textarea
                  id="message"
                  className="min-h-[120px] rounded-xl border-[#d9ead6] focus:border-[#a4c692]"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
                <div className={`text-xs mt-1 font-medium flex justify-end ${formData.message.length > 160 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {formData.message.length > 160 && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                  {formData.message.length} / 160 chars
                  {formData.message.length > 160 && " (May send as multiple SMS)"}
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
      {false && (
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
                        <Cell fill="#a2d2ff" /><Cell fill="#cdb4db" /><Cell fill="#ffc8dd" /><Cell fill="#bde0fe" /><Cell fill="#ffafcc" />
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
      )}

      {/* ── Scheduled Messages Manager ──────────────────────────────────── */}
      {false && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
        >
          <Collapsible open={isManagerOpen} onOpenChange={setIsManagerOpen} className="border border-[#d9ead6] rounded-[1.5rem] overflow-hidden shadow-2xl shadow-[#a4c692]/20 bg-white">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex justify-between items-center p-6 hover:bg-[#eff7ed] transition-colors duration-200">
                <div className="flex items-center gap-3 text-[#3d5a36]">
                  <CalendarClock className="h-5 w-5 text-[#5d8044]" />
                  <span className="font-semibold">Scheduled Messages Manager</span>
                  {scheduledMessages.some(m => m.is_test === 1 && m.active === 1 && !m.queued_at) && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      test messages pending
                    </span>
                  )}
                </div>
                {isManagerOpen ? <ChevronUp className="text-[#5d8044]" /> : <ChevronDown className="text-[#5d8044]" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-[#e5ede0] bg-[#f8fdf3]">
              <div className="p-6 space-y-4">
                {scheduledMessages.some(m => m.is_test === 1 && m.active === 1 && !m.queued_at) && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-800 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                    <p><strong>Test messages detected.</strong> The scheduler skips them automatically, but delete or mark them as sent before adding new workers.</p>
                  </div>
                )}
                {scheduledMessages.length === 0 ? (
                  <p className="text-center text-[#7b8f6f] py-8">No scheduled messages found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e5ede0] text-[#7b8f6f] text-left">
                          <th className="pb-3 font-medium">Name</th>
                          <th className="pb-3 font-medium">Batch</th>
                          <th className="pb-3 font-medium">Scheduled For</th>
                          <th className="pb-3 font-medium text-center">Q/S</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduledMessages.map((m) => {
                          const isTest = m.is_test === 1;
                          const isProcessed = !m.active || !!m.queued_at;
                          const delBusy = managerAction === m.id + '-del';
                          const sentBusy = managerAction === m.id + '-sent';
                          const testBusy = managerAction === m.id + '-test';
                          return (
                            <tr key={m.id} className="border-b border-[#f0f7ee] hover:bg-[#eff7ed] transition-colors">
                              <td className="py-3 pr-3 font-medium text-[#3d5a36] max-w-[140px]">
                                <p className="truncate" title={m.name}>{m.name}</p>
                              </td>
                              <td className="py-3 pr-3">
                                {m.batch_name
                                  ? <span className="flex items-center gap-1 text-xs text-[#3d5a36]"><Layers className="h-3 w-3" />{m.batch_name}</span>
                                  : <span className="text-xs text-[#7b8f6f] italic">All</span>}
                              </td>
                              <td className="py-3 pr-3 text-[#556d4a]">
                                {m.scheduled_send_datetime
                                  ? new Date(m.scheduled_send_datetime).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : '—'}
                              </td>
                              <td className="py-3 pr-3 text-center text-[#556d4a] font-mono text-xs">{m.queued_count}/{m.sent_count}</td>
                              <td className="py-3 pr-3">
                                {isTest
                                  ? <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit"><FlaskConical className="h-3 w-3" />Test</span>
                                  : isProcessed
                                    ? <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-300 w-fit block">Processed</span>
                                    : <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 border border-green-300 w-fit block">Pending</span>}
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1.5 justify-end flex-wrap">
                                  <Button size="sm" variant="outline"
                                    disabled={!!managerAction}
                                    onClick={() => handleManagerToggleTest(m.id)}
                                    className={`text-xs gap-1 ${isTest ? 'border-amber-400 text-amber-700 hover:bg-amber-50' : 'border-[#d9ead6] text-[#556d4a] hover:bg-[#eff7ed]'}`}>
                                    <FlaskConical className="h-3 w-3" />
                                    {testBusy ? '…' : isTest ? 'Unflag' : 'Test'}
                                  </Button>
                                  <Button size="sm" variant="outline"
                                    disabled={!!managerAction || isProcessed}
                                    onClick={() => handleManagerMarkSent(m.id)}
                                    className="text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                                    <CheckCircle className="h-3 w-3" />
                                    {sentBusy ? '…' : 'Mark Sent'}
                                  </Button>
                                  <Button size="sm" variant="destructive"
                                    disabled={!!managerAction}
                                    onClick={() => handleManagerDelete(m.id)}
                                    className="text-xs gap-1">
                                    <Trash2 className="h-3 w-3" />
                                    {delBusy ? '…' : 'Delete'}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      )}

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
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Target Batch</TableHead>
                    <TableHead>Send Time</TableHead>
                    <TableHead>Message Preview</TableHead>
                    <TableHead>Day</TableHead>
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
                      <TableCell className="font-medium text-[#3d5a36]">{template.name}</TableCell>
                      <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>{template.category}</span></TableCell>
                      <TableCell>
                        {template.batch_name
                          ? <Badge variant="outline" className="border-[#d9ead6] text-[#3d5a36] flex items-center gap-1 w-fit"><Layers className="h-3 w-3" />{template.batch_name}</Badge>
                          : <span className="text-xs text-[#7b8f6f] italic">All Batches</span>}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-[#556d4a] font-mono">
                          <Clock className="h-3 w-3 text-[#5d8044]" />
                          {template.scheduled_time ?? "06:00"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs"><p className="text-sm text-[#556d4a] truncate">{template.message}</p></TableCell>
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