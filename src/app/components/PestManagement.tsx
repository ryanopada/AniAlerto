import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Bug, Plus, Pencil, RefreshCw, Calendar, CheckCircle, Clock, Activity } from "lucide-react";

interface PestAdvisory {
  id: number;
  option_number: number;
  pest_name: string;
  advisory_en: string;
  advisory_tl: string;
  is_active: number;
}

interface PestReport {
  id: number;
  phone: string;
  status: string;
  notes: string | null;
  reported_at: string;
  completed_at: string | null;
  advisory_sent: string | null;
  worker_name: string | null;
  batch_name: string | null;
  pest_name: string | null;
}

export function PestManagement() {
  const [advisories, setAdvisories] = useState<PestAdvisory[]>([]);
  const [reports, setReports] = useState<PestReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [editingAdvisory, setEditingAdvisory] = useState<Partial<PestAdvisory> | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://lightpink-cattle-667968.hostingersite.com';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advRes, repRes] = await Promise.all([
        fetch(`${API_URL}/api/get_pest_advisories.php`),
        fetch(`${API_URL}/api/get_pest_reports.php`)
      ]);
      const advData = await advRes.json();
      const repData = await repRes.json();
      if (advData.status === 'success') setAdvisories(advData.data);
      if (repData.status === 'success') setReports(repData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveAdvisory = async () => {
    if (!editingAdvisory?.option_number || !editingAdvisory?.pest_name || !editingAdvisory?.advisory_en || !editingAdvisory?.advisory_tl) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/manage_pest_advisories.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingAdvisory.id ? "update" : "create",
          ...editingAdvisory
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsDialogOpen(false);
        fetchData();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (id: number, currentActive: number) => {
    try {
      await fetch(`${API_URL}/api/manage_pest_advisories.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          id,
          is_active: currentActive === 1 ? 0 : 1
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2c4025]">Pest Control & Advisories</h1>
          <p className="text-[#556d4a]">Manage pest protocols and monitor worker pest incident reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Advisories Configuration */}
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] bg-white flex flex-col">
          <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0] p-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-[#3d5a36] flex items-center gap-2">
                  <Bug className="h-5 w-5 text-[#5d8044]" />
                  Pest Advisories
                </CardTitle>
                <CardDescription>Configure the dynamic pest menu and protocols</CardDescription>
              </div>
              <Button onClick={() => { setEditingAdvisory({ is_active: 1 }); setIsDialogOpen(true); }} className="bg-[#5d8044] hover:bg-[#4a6b35] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Advisory
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-[#f3faf2] sticky top-0">
                <TableRow>
                  <TableHead className="pl-6">Opt #</TableHead>
                  <TableHead>Pest Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#7b8f6f]"/></TableCell></TableRow>
                ) : advisories.map(adv => (
                  <TableRow key={adv.id} className="hover:bg-[#f5fbf3] border-b border-[#f0f7ee]">
                    <TableCell className="pl-6 font-semibold text-[#5d8044]">{adv.option_number}</TableCell>
                    <TableCell className="font-medium text-[#3d5a36]">{adv.pest_name}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={adv.is_active === 1} 
                        onCheckedChange={() => handleToggleActive(adv.id, adv.is_active)} 
                      />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingAdvisory(adv); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4 text-[#7b8f6f]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pest Incident Reports */}
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] bg-white flex flex-col">
          <CardHeader className="bg-[#f5fbf3] border-b border-[#e5ede0] p-6">
            <CardTitle className="text-[#3d5a36] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#5d8044]" />
              Recent Pest Reports
            </CardTitle>
            <CardDescription>Live monitoring of pest incidents from the field</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="bg-[#f3faf2] sticky top-0">
                <TableRow>
                  <TableHead className="pl-6">Date</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Pest Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#7b8f6f]"/></TableCell></TableRow>
                ) : reports.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No pest reports found.</TableCell></TableRow>
                ) : reports.map(rep => (
                  <TableRow key={rep.id} className="hover:bg-[#f5fbf3] border-b border-[#f0f7ee]">
                    <TableCell className="pl-6 text-sm">
                      <div className="flex items-center gap-1.5 text-[#556d4a]">
                        <Calendar className="h-3 w-3" />
                        {new Date(rep.reported_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#7b8f6f]">
                        <Clock className="h-3 w-3" />
                        {new Date(rep.reported_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-[#3d5a36]">{rep.worker_name || "Unknown"}</div>
                      <div className="text-xs text-[#7b8f6f]">{rep.batch_name || "No Batch"}</div>
                    </TableCell>
                    <TableCell>
                      {rep.pest_name ? (
                        <span className="font-semibold text-red-700">{rep.pest_name}</span>
                      ) : (
                        <span className="text-xs italic text-gray-500">Pending Identification</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        rep.status === 'Completed' ? "bg-emerald-100 text-emerald-800" :
                        rep.status === 'Identified' ? "bg-amber-100 text-amber-800" :
                        "bg-red-100 text-red-800 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                      }>
                        {rep.status === 'Completed' ? <><CheckCircle className="h-3 w-3 mr-1"/> Completed</> : rep.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] border-[#d9ead6] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#2c4025]">{editingAdvisory?.id ? 'Edit' : 'Add'} Pest Advisory</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-[#556d4a]">Option #</label>
              <Input
                type="number"
                className="col-span-3 border-[#d9ead6]"
                value={editingAdvisory?.option_number || ''}
                onChange={e => setEditingAdvisory({...editingAdvisory, option_number: parseInt(e.target.value)})}
                placeholder="e.g. 1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-[#556d4a]">Pest Name</label>
              <Input
                className="col-span-3 border-[#d9ead6]"
                value={editingAdvisory?.pest_name || ''}
                onChange={e => setEditingAdvisory({...editingAdvisory, pest_name: e.target.value})}
                placeholder="e.g. Harabas (Fall Armyworm)"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm font-medium text-[#556d4a] pt-2">Advisory (EN)</label>
              <Textarea
                className="col-span-3 border-[#d9ead6] min-h-[100px]"
                value={editingAdvisory?.advisory_en || ''}
                onChange={e => setEditingAdvisory({...editingAdvisory, advisory_en: e.target.value})}
                placeholder="English protocol instructions..."
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm font-medium text-[#556d4a] pt-2">Advisory (TL)</label>
              <Textarea
                className="col-span-3 border-[#d9ead6] min-h-[100px]"
                value={editingAdvisory?.advisory_tl || ''}
                onChange={e => setEditingAdvisory({...editingAdvisory, advisory_tl: e.target.value})}
                placeholder="Tagalog protocol instructions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-[#d9ead6] text-[#556d4a]">Cancel</Button>
            <Button onClick={handleSaveAdvisory} className="bg-[#5d8044] hover:bg-[#4a6b35] text-white">Save Advisory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
