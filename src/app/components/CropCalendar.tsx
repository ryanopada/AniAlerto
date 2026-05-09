import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Calendar, Sprout, Loader2, MapPin, Leaf, Send, CheckCircle, Clock, AlertCircle, Users, ChevronRight, Info } from "lucide-react";
import { motion } from "motion/react";

interface SMSEvent {
  template_id: string;
  template_name: string;
  category: string;
  message: string;
  days_after_planting: number;
  due_date: string;
  status: "sent" | "today" | "upcoming";
  expected_responses: string[];
}

interface Worker {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface BatchTimeline {
  batch_id: string;
  batch_name: string;
  location: string;
  variety: string;
  area: string;
  status: string;
  planting_date: string;
  harvest_date: string;
  current_day: number;
  total_days: number;
  progress_percent: number;
  sms_schedule: SMSEvent[];
  workers: Worker[];
  notes: string;
}

const categoryColors: Record<string, string> = {
  "Irrigation": "bg-blue-100 text-blue-800 border-blue-200",
  "Fertilization": "bg-green-100 text-green-800 border-green-200",
  "Pest Control": "bg-red-100 text-red-800 border-red-200",
  "Harvest": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "General": "bg-gray-100 text-gray-800 border-gray-200",
};

const statusDot: Record<string, string> = {
  sent: "bg-green-500",
  today: "bg-yellow-500 animate-pulse",
  upcoming: "bg-gray-300",
};

export function CropCalendar() {
  const [timeline, setTimeline] = useState<BatchTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchTimeline | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SMSEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEventOpen, setIsEventOpen] = useState(false);

  const API_URL = "http://localhost/anialerto-backend/src/crop_calendar.php";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setTimeline(data.timeline || []);
      } catch (e) {
        console.error("Error fetching crop calendar:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openBatchDetail = (batch: BatchTimeline) => {
    setSelectedBatch(batch);
    setIsDetailOpen(true);
  };

  const openEventDetail = (event: SMSEvent, batch: BatchTimeline) => {
    setSelectedBatch(batch);
    setSelectedEvent(event);
    setIsEventOpen(true);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#5d8044] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">Crop Calendar</h1>
          <p className="text-[#556d4a]">Visual timeline of batches, growth stages & scheduled SMS</p>
        </div>
        <div className="bg-[#5d8044]/10 text-[#5d8044] px-4 py-2 rounded-full text-sm font-medium border border-[#5d8044]/20">
          <Calendar className="inline h-4 w-4 mr-1" /> Today: {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </motion.div>

      {/* Batch Timeline Cards */}
      {timeline.length === 0 ? (
        <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-xl bg-white">
          <CardContent className="py-16 text-center text-[#7b8f6f]">
            <Sprout className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No active batches found</p>
            <p className="text-sm">Create a farm batch to see the crop calendar</p>
          </CardContent>
        </Card>
      ) : (
        timeline.map((batch, bIdx) => (
          <motion.div
            key={batch.batch_id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: bIdx * 0.1 }}
          >
            <Card className="rounded-[1.5rem] border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
              {/* Batch Header */}
              <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0] pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[#3d5a36] flex items-center gap-2">
                      <Sprout className="h-5 w-5 text-[#5d8044]" />
                      {batch.batch_name}
                      <Badge className={batch.status === "Active" ? "bg-[#e4fde1] text-[#5d8044]" : "bg-gray-100 text-gray-500"}>
                        {batch.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-[#556d4a] flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{batch.location}</span>
                      <span className="flex items-center gap-1"><Leaf className="h-3.5 w-3.5" />{batch.variety}</span>
                      <span>{batch.area}</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{batch.workers.length} worker(s)</span>
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-[#5d8044] text-[#3d5a36]" onClick={() => openBatchDetail(batch)}>
                    <Info className="h-4 w-4 mr-1" /> Details
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#556d4a]">
                    <span>🌱 Planted: {formatDate(batch.planting_date)}</span>
                    <span className="font-bold text-[#5d8044]">Day {batch.current_day} / {batch.total_days}</span>
                    <span>🌽 Harvest: {formatDate(batch.harvest_date)}</span>
                  </div>
                  <div className="relative h-8 bg-[#e5ede0] rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8acb88] to-[#5d8044] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${batch.progress_percent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: bIdx * 0.15 }}
                    />
                    {/* SMS markers on the progress bar */}
                    {batch.sms_schedule.map((evt) => {
                      const pos = Math.min(100, (evt.days_after_planting / batch.total_days) * 100);
                      return (
                        <button
                          key={evt.template_id}
                          className="absolute top-1/2 -translate-y-1/2 z-10 group"
                          style={{ left: `${pos}%` }}
                          onClick={() => openEventDetail(evt, batch)}
                          title={`Day ${evt.days_after_planting}: ${evt.template_name}`}
                        >
                          <span className={`block h-4 w-4 rounded-full border-2 border-white shadow-md ${statusDot[evt.status]} cursor-pointer transition-transform hover:scale-150`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SMS Schedule Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#f3faf2]">
                      <TableRow>
                        <TableHead className="w-[60px]">Day</TableHead>
                        <TableHead>Advisory</TableHead>
                        <TableHead className="w-[110px]">Category</TableHead>
                        <TableHead className="w-[100px]">Due Date</TableHead>
                        <TableHead className="w-[80px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batch.sms_schedule.map((evt, i) => (
                        <motion.tr
                          key={evt.template_id}
                          className={`cursor-pointer transition-colors duration-200 ${evt.status === "today" ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-[#eff7ed]"}`}
                          onClick={() => openEventDetail(evt, batch)}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                        >
                          <TableCell className="font-bold text-[#5d8044]">{evt.days_after_planting}</TableCell>
                          <TableCell className="text-sm text-[#3d5a36]">{evt.template_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${categoryColors[evt.category] || categoryColors["General"]}`}>
                              {evt.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-[#7b8f6f]">{formatDate(evt.due_date)}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${statusDot[evt.status]}`} />
                              <span className={`text-xs font-medium ${evt.status === "sent" ? "text-green-700" : evt.status === "today" ? "text-yellow-700" : "text-gray-500"}`}>
                                {evt.status === "sent" ? "Sent" : evt.status === "today" ? "Today" : "Upcoming"}
                              </span>
                            </span>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}

      {/* Batch Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl">
          {selectedBatch && (
            <>
              <DialogHeader className="border-b border-[#e5ede0] pb-4">
                <DialogTitle className="text-[#3d5a36] flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-[#5d8044]" /> {selectedBatch.batch_name}
                </DialogTitle>
                <DialogDescription className="text-[#556d4a]">
                  {selectedBatch.location} • {selectedBatch.variety} • {selectedBatch.area}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Batch Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Planted", value: formatDate(selectedBatch.planting_date), icon: <Sprout className="h-4 w-4" /> },
                    { label: "Harvest Est.", value: formatDate(selectedBatch.harvest_date), icon: <Calendar className="h-4 w-4" /> },
                    { label: "Current Day", value: `Day ${selectedBatch.current_day}`, icon: <Clock className="h-4 w-4" /> },
                    { label: "Progress", value: `${selectedBatch.progress_percent}%`, icon: <CheckCircle className="h-4 w-4" /> },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl p-3 border border-[#d9ead6] text-center">
                      <div className="flex items-center justify-center gap-1 text-[#5d8044] mb-1">
                        {item.icon}
                        <span className="text-[10px] font-bold uppercase">{item.label}</span>
                      </div>
                      <p className="text-sm font-bold text-[#3d5a36]">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Assigned Workers */}
                <div>
                  <h3 className="text-sm font-bold text-[#3d5a36] mb-2 flex items-center gap-1"><Users className="h-4 w-4" /> Assigned Workers</h3>
                  {selectedBatch.workers.length === 0 ? (
                    <p className="text-sm text-[#7b8f6f]">No workers assigned</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedBatch.workers.map((w) => (
                        <div key={w.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#e5ede0]">
                          <div>
                            <p className="font-medium text-sm text-[#3d5a36]">{w.name}</p>
                            <p className="text-xs text-[#7b8f6f] font-mono">{w.phone}</p>
                          </div>
                          <Badge className={w.status === "Active" ? "bg-[#e4fde1] text-[#5d8044]" : "bg-gray-100 text-gray-500"}>{w.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedBatch.notes && (
                  <div className="bg-[#eff7ec] rounded-xl p-3 border border-[#d9ead6]">
                    <p className="text-xs font-bold text-[#5d8044] uppercase mb-1">Notes</p>
                    <p className="text-sm text-[#3d5a36]">{selectedBatch.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SMS Event Detail Dialog */}
      <Dialog open={isEventOpen} onOpenChange={setIsEventOpen}>
        <DialogContent className="max-w-lg rounded-[1.5rem] border border-[#d9ead6] bg-[#f8fdf3] shadow-2xl">
          {selectedEvent && selectedBatch && (
            <>
              <DialogHeader className="border-b border-[#e5ede0] pb-4">
                <DialogTitle className="text-[#3d5a36] flex items-center gap-2">
                  <Send className="h-5 w-5 text-[#5d8044]" /> {selectedEvent.template_name}
                </DialogTitle>
                <DialogDescription className="text-[#556d4a]">
                  Day {selectedEvent.days_after_planting} • {selectedBatch.batch_name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className={categoryColors[selectedEvent.category] || categoryColors["General"]}>
                    {selectedEvent.category}
                  </Badge>
                  <Badge className={
                    selectedEvent.status === "sent" ? "bg-green-100 text-green-800" :
                    selectedEvent.status === "today" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-600"
                  }>
                    {selectedEvent.status === "sent" ? "✅ Sent" : selectedEvent.status === "today" ? "⚡ Due Today" : "📅 Upcoming"}
                  </Badge>
                  <span className="text-sm text-[#7b8f6f]">{formatDate(selectedEvent.due_date)}</span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-[#d9ead6]">
                  <p className="text-xs font-bold text-[#5d8044] uppercase mb-2">SMS Message Content</p>
                  <p className="text-sm text-[#3d5a36] leading-relaxed">{selectedEvent.message}</p>
                </div>

                {selectedEvent.expected_responses && selectedEvent.expected_responses.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[#5d8044] uppercase mb-2">Expected Worker Responses</p>
                    <div className="flex gap-2 flex-wrap">
                      {selectedEvent.expected_responses.map((r) => (
                        <Badge key={r} variant="outline" className={
                          r === "DONE" ? "border-green-300 text-green-700 bg-green-50" :
                          r === "DELAY" ? "border-yellow-300 text-yellow-700 bg-yellow-50" :
                          r === "HELP" ? "border-red-300 text-red-700 bg-red-50" :
                          "border-gray-300 text-gray-600"
                        }>{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-bold text-[#5d8044] uppercase mb-2">Recipients ({selectedBatch.workers.length})</p>
                  {selectedBatch.workers.map((w) => (
                    <div key={w.id} className="flex items-center gap-2 text-sm text-[#3d5a36] py-1">
                      <Users className="h-3.5 w-3.5 text-[#5d8044]" />
                      <span className="font-medium">{w.name}</span>
                      <span className="text-[#7b8f6f] font-mono text-xs">{w.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
