import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { MessageSquare, CheckCircle, Clock, AlertCircle, Search, Plus, Edit, Trash2, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

interface SMSLog {
  id: string;
  worker: string;
  phone: string;
  batch: string;
  message: string;
  sentDate: string;
  sentTime: string;
  response: "DONE" | "DELAY" | "HELP" | "Pending";
  responseDate?: string;
  responseTime?: string;
}

interface CommandResponse {
  id: string;
  command: string;
  description: string;
  color: string;
  action: string;
}

export function SMSMonitoring() {
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "DONE" | "DELAY" | "HELP" | "Pending">("All");
  const [isAddResponseOpen, setIsAddResponseOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CommandResponse | null>(null);

  const [commandResponses, setCommandResponses] = useState<CommandResponse[]>([
    {
      id: "CMD001",
      command: "DONE",
      description: "Task completed successfully",
      color: "green",
      action: "Mark task as completed",
    },
    {
      id: "CMD002",
      command: "DELAY",
      description: "Task delayed or in progress",
      color: "yellow",
      action: "Flag for follow-up",
    },
    {
      id: "CMD003",
      command: "HELP",
      description: "Worker needs assistance",
      color: "red",
      action: "Send immediate support",
    },
    {
      id: "CMD004",
      command: "CANCEL",
      description: "Task cancelled",
      color: "gray",
      action: "Mark task as cancelled and remove from schedule",
    },
    {
      id: "CMD005",
      command: "OK",
      description: "Message acknowledged",
      color: "blue",
      action: "Mark message as read and acknowledged",
    },
  ]);

  const [newResponse, setNewResponse] = useState({
    command: "",
    description: "",
    color: "blue",
    action: "",
  });

  const [smsLogs] = useState<SMSLog[]>([
    {
      id: "SMS001",
      worker: "Juan Dela Cruz",
      phone: "+63 912 345 6789",
      batch: "BR-2026-001",
      message: "Reminder: Perform irrigation check today. Ensure adequate soil moisture. Reply DONE when complete.",
      sentDate: "2026-03-05",
      sentTime: "08:00 AM",
      response: "DONE",
      responseDate: "2026-03-05",
      responseTime: "10:30 AM",
    },
    {
      id: "SMS002",
      worker: "Maria Santos",
      phone: "+63 923 456 7890",
      batch: "BR-2026-001",
      message: "Reminder: Perform irrigation check today. Ensure adequate soil moisture. Reply DONE when complete.",
      sentDate: "2026-03-05",
      sentTime: "08:00 AM",
      response: "DONE",
      responseDate: "2026-03-05",
      responseTime: "11:15 AM",
    },
    {
      id: "SMS003",
      worker: "Pedro Reyes",
      phone: "+63 934 567 8901",
      batch: "BR-2026-002",
      message: "Apply second side dressing today! Urea (2 bags/ha) between rows. Hill up soil around plants. Reply DONE when complete.",
      sentDate: "2026-03-05",
      sentTime: "08:15 AM",
      response: "DELAY",
      responseDate: "2026-03-05",
      responseTime: "09:45 AM",
    },
    {
      id: "SMS004",
      worker: "Ana Garcia",
      phone: "+63 945 678 9012",
      batch: "BR-2026-002",
      message: "Apply second side dressing today! Urea (2 bags/ha) between rows. Hill up soil around plants. Reply DONE when complete.",
      sentDate: "2026-03-05",
      sentTime: "08:15 AM",
      response: "Pending",
    },
    {
      id: "SMS005",
      worker: "Jose Martinez",
      phone: "+63 956 789 0123",
      batch: "BR-2026-003",
      message: "Conduct pest monitoring today. Check for corn borer and armyworm. Report findings or reply HELP if assistance needed.",
      sentDate: "2026-03-05",
      sentTime: "07:30 AM",
      response: "HELP",
      responseDate: "2026-03-05",
      responseTime: "09:00 AM",
    },
    {
      id: "SMS006",
      worker: "Rosa Fernandez",
      phone: "+63 967 890 1234",
      batch: "BR-2026-003",
      message: "Time for first side dressing! Apply Urea (2 bags/ha) beside plants. Incorporate and irrigate. Reply DONE when finished.",
      sentDate: "2026-03-04",
      sentTime: "08:00 AM",
      response: "DONE",
      responseDate: "2026-03-04",
      responseTime: "02:30 PM",
    },
    {
      id: "SMS007",
      worker: "Juan Dela Cruz",
      phone: "+63 912 345 6789",
      batch: "BR-2026-001",
      message: "Time for first side dressing! Apply Urea (2 bags/ha) beside plants. Incorporate and irrigate. Reply DONE when finished.",
      sentDate: "2026-03-04",
      sentTime: "08:00 AM",
      response: "DONE",
      responseDate: "2026-03-04",
      responseTime: "01:45 PM",
    },
    {
      id: "SMS008",
      worker: "Maria Santos",
      phone: "+63 923 456 7890",
      batch: "BR-2026-001",
      message: "Conduct pest monitoring today. Check for corn borer and armyworm. Report findings or reply HELP if assistance needed.",
      sentDate: "2026-03-03",
      sentTime: "07:30 AM",
      response: "DONE",
      responseDate: "2026-03-03",
      responseTime: "11:00 AM",
    },
  ]);

  const getResponseBadge = (response: SMSLog["response"]) => {
    switch (response) {
      case "DONE":
        return { variant: "default" as const, icon: CheckCircle, color: "text-green-600" };
      case "DELAY":
        return { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" };
      case "HELP":
        return { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" };
      case "Pending":
        return { variant: "outline" as const, icon: MessageSquare, color: "text-gray-600" };
    }
  };

  const filteredLogs = smsLogs.filter(log => {
    const matchesSearch = 
      log.worker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === "All" || log.response === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: smsLogs.length,
    done: smsLogs.filter(log => log.response === "DONE").length,
    delay: smsLogs.filter(log => log.response === "DELAY").length,
    help: smsLogs.filter(log => log.response === "HELP").length,
    pending: smsLogs.filter(log => log.response === "Pending").length,
  };

  const handleAddResponse = () => {
    if (newResponse.command && newResponse.description && newResponse.action) {
      const response: CommandResponse = {
        id: `CMD${String(commandResponses.length + 1).padStart(3, '0')}`,
        ...newResponse,
      };
      setCommandResponses([...commandResponses, response]);
      setNewResponse({ command: "", description: "", color: "blue", action: "" });
      setIsAddResponseOpen(false);
    }
  };

  const handleEditResponse = () => {
    if (editingResponse) {
      setCommandResponses(
        commandResponses.map(cmd => 
          cmd.id === editingResponse.id ? editingResponse : cmd
        )
      );
      setEditingResponse(null);
    }
  };

  const handleDeleteResponse = (id: string) => {
    setCommandResponses(commandResponses.filter(cmd => cmd.id !== id));
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      green: "bg-green-100 text-green-800 border-green-300",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
      red: "bg-red-100 text-red-800 border-red-300",
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      orange: "bg-orange-100 text-orange-800 border-orange-300",
      gray: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">SMS Monitoring</h1>
        <p className="text-gray-600">Monitor sent messages and track worker responses</p>
      </div>

      {/* Command Responses Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Command Responses</CardTitle>
              <CardDescription>Configure available SMS response commands</CardDescription>
            </div>
            <Dialog open={isAddResponseOpen} onOpenChange={setIsAddResponseOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#8acb88] hover:bg-[#648381]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Response
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Command Response</DialogTitle>
                  <DialogDescription>
                    Define a new SMS command that workers can use to respond
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="command">Command Keyword</Label>
                    <Input
                      id="command"
                      placeholder="e.g., COMPLETE, CANCEL, OK"
                      value={newResponse.command}
                      onChange={(e) => setNewResponse({ ...newResponse, command: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="What does this command mean?"
                      value={newResponse.description}
                      onChange={(e) => setNewResponse({ ...newResponse, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Display Color</Label>
                    <select
                      id="color"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={newResponse.color}
                      onChange={(e) => setNewResponse({ ...newResponse, color: e.target.value })}
                    >
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="gray">Gray</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">System Action</Label>
                    <Textarea
                      id="action"
                      placeholder="What should the system do when this command is received?"
                      value={newResponse.action}
                      onChange={(e) => setNewResponse({ ...newResponse, action: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddResponseOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddResponse} className="bg-[#8acb88] hover:bg-[#648381]">
                      Add Command
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {commandResponses.map((cmd) => (
              <div
                key={cmd.id}
                className={`border-2 rounded-lg p-4 ${getColorClass(cmd.color)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">{cmd.command}</div>
                  <div className="flex gap-1">
                    <Dialog open={editingResponse?.id === cmd.id} onOpenChange={(open) => !open && setEditingResponse(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setEditingResponse(cmd)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Command Response</DialogTitle>
                          <DialogDescription>
                            Update the command configuration
                          </DialogDescription>
                        </DialogHeader>
                        {editingResponse && (
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-command">Command Keyword</Label>
                              <Input
                                id="edit-command"
                                value={editingResponse.command}
                                onChange={(e) => setEditingResponse({ ...editingResponse, command: e.target.value.toUpperCase() })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Input
                                id="edit-description"
                                value={editingResponse.description}
                                onChange={(e) => setEditingResponse({ ...editingResponse, description: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-color">Display Color</Label>
                              <select
                                id="edit-color"
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                value={editingResponse.color}
                                onChange={(e) => setEditingResponse({ ...editingResponse, color: e.target.value })}
                              >
                                <option value="green">Green</option>
                                <option value="yellow">Yellow</option>
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="gray">Gray</option>
                                <option value="purple">Purple</option>
                                <option value="orange">Orange</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-action">System Action</Label>
                              <Textarea
                                id="edit-action"
                                value={editingResponse.action}
                                onChange={(e) => setEditingResponse({ ...editingResponse, action: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setEditingResponse(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleEditResponse} className="bg-[#8acb88] hover:bg-[#648381]">
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteResponse(cmd.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm mb-2">{cmd.description}</p>
                <p className="text-xs opacity-75">
                  <strong>Action:</strong> {cmd.action}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delayed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.delay}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Need Help</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.help}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
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
                  <CardTitle>SMS Analytics & Visualizations</CardTitle>
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
                {/* Response Status Distribution */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Response Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: stats.done },
                          { name: 'Pending', value: stats.pending },
                          { name: 'Delayed', value: stats.delay },
                          { name: 'Need Help', value: stats.help }
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
                        <Cell fill="#ffbf46" />
                        <Cell fill="#dc2626" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* SMS by Batch */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">SMS Messages by Batch</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from(new Set(smsLogs.map(s => s.batch))).map(batch => ({
                        batch,
                        count: smsLogs.filter(s => s.batch === batch).length
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="batch" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Messages" fill="#8acb88" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Response Time Trend */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Daily Message Volume</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={Array.from(new Set(smsLogs.map(s => s.sentDate)))
                        .sort()
                        .map(date => ({
                          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          messages: smsLogs.filter(s => s.sentDate === date).length,
                          completed: smsLogs.filter(s => s.sentDate === date && s.response === 'DONE').length
                        }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="messages" name="Total Messages" stroke="#648381" fill="#648381" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="completed" name="Completed" stroke="#8acb88" fill="#8acb88" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Response Rate by Worker */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#575761]">Response Rate by Worker</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from(new Set(smsLogs.map(s => s.worker))).map(worker => {
                        const workerLogs = smsLogs.filter(s => s.worker === worker);
                        const completedLogs = workerLogs.filter(s => s.response === 'DONE');
                        return {
                          worker: worker.split(' ')[0],
                          rate: workerLogs.length > 0 ? Math.round((completedLogs.length / workerLogs.length) * 100) : 0
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="worker" angle={-15} textAnchor="end" height={80} />
                      <YAxis allowDecimals={false} unit="%" />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="rate" name="Completion Rate" fill="#ffbf46" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by worker, batch, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "All" ? "default" : "outline"}
                onClick={() => setFilterStatus("All")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === "DONE" ? "default" : "outline"}
                onClick={() => setFilterStatus("DONE")}
                size="sm"
              >
                Done
              </Button>
              <Button
                variant={filterStatus === "DELAY" ? "default" : "outline"}
                onClick={() => setFilterStatus("DELAY")}
                size="sm"
              >
                Delay
              </Button>
              <Button
                variant={filterStatus === "HELP" ? "default" : "outline"}
                onClick={() => setFilterStatus("HELP")}
                size="sm"
              >
                Help
              </Button>
              <Button
                variant={filterStatus === "Pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("Pending")}
                size="sm"
              >
                Pending
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Message Logs</CardTitle>
          <CardDescription>
            View all sent messages and worker responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Responded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const badge = getResponseBadge(log.response);
                  const Icon = badge.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>{log.worker}</TableCell>
                      <TableCell className="text-sm">{log.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.batch}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {log.message}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{log.sentDate}</div>
                        <div className="text-gray-500">{log.sentTime}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className="flex items-center gap-1 w-fit">
                          <Icon className={`h-3 w-3 ${badge.color}`} />
                          {log.response}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.responseDate ? (
                          <>
                            <div>{log.responseDate}</div>
                            <div className="text-gray-500">{log.responseTime}</div>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No messages found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Response Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Completed (DONE)</span>
                <span className="text-sm text-gray-600">{stats.done} / {stats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(stats.done / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Delayed (DELAY)</span>
                <span className="text-sm text-gray-600">{stats.delay} / {stats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full" 
                  style={{ width: `${(stats.delay / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Need Help (HELP)</span>
                <span className="text-sm text-gray-600">{stats.help} / {stats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-600 h-2 rounded-full" 
                  style={{ width: `${(stats.help / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Pending Response</span>
                <span className="text-sm text-gray-600">{stats.pending} / {stats.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full" 
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
