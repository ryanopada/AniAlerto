import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { FileText, Download, TrendingUp, Users, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

export function Reports() {
  const [reportType, setReportType] = useState<"messages" | "workers">("messages");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost/anialerto-backend/src/get_reports_data.php");
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: Check if the file exists in /src/`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err instanceof Error ? err.message : "Unable to load reports data.");
      setData({
        summary: { total: 0, completionRate: 0, activeWorkers: 0, helpRequests: 0 },
        dailyVolume: [],
        statusDistribution: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleDownloadReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="h-10 w-10 animate-spin text-[#8acb88] mb-4" />
        <p className="text-gray-500 animate-pulse">Connecting to anialerto.sms_logs...</p>
      </div>
    );
  }

  function StatCard({ title, value, icon, color, textColor }: { title: string; value: string | number; icon: ReactNode; color: string; textColor: string }) {
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

  return (
    <div className="space-y-6">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#3d5a36]">Reports and Logs</h1>
          <p className="text-[#556d4a]">Database-driven insights from your SMS activity</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button className="bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]" onClick={fetchReportData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
          </Button>
        </motion.div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Connection Error: {error}. Please check if XAMPP is running.</p>
        </div>
      )}

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <StatCard title="Total Messages" value={data?.summary?.total || 0} icon={<MessageSquare className="h-6 w-6" />} color="border-l-[#5d8044]" textColor="text-[#3d5a36]" />
        <StatCard title="Completion Rate" value={`${data?.summary?.completionRate || 0}%`} icon={<TrendingUp className="h-6 w-6" />} color="border-l-[#5d8044]" textColor="text-[#5d8044]" />
        <StatCard title="Active Workers" value={data?.summary?.activeWorkers || 0} icon={<Users className="h-6 w-6" />} color="border-l-[#5d8044]" textColor="text-[#3d5a36]" />
        <StatCard title="Help Requests" value={data?.summary?.helpRequests || 0} icon={<FileText className="h-6 w-6" />} color="border-l-[#d97706]" textColor="text-red-600" />
      </motion.div>

      {/* Report Configuration */}
      <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
        <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
          <CardTitle className="text-[#3d5a36]">Report Options</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data View</Label>
              <select
                className="w-full rounded-xl border border-[#d9ead6] bg-white px-3 py-3 text-sm shadow-sm"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
              >
                <option value="messages">Message Volume History</option>
                <option value="workers">Worker Engagement</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <input type="date" className="flex-1 rounded-xl border border-[#d9ead6] bg-white px-3 py-3 text-sm shadow-sm" value={dateRange.from} readOnly />
                <input type="date" className="flex-1 rounded-xl border border-[#d9ead6] bg-white px-3 py-3 text-sm shadow-sm" value={dateRange.to} readOnly />
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full bg-[#5d8044] hover:bg-[#4a6b36] text-white shadow-lg shadow-[#5d8044]/20 border border-[#7a9b5c]" onClick={handleDownloadReport}>
              <Download className="h-4 w-4 mr-2" /> Print PDF Report
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card className="border border-[#d9ead6] rounded-[1.5rem] shadow-2xl shadow-[#a4c692]/20 bg-gradient-to-br from-white to-[#f8fdf3] overflow-hidden">
        <CardHeader className="bg-[#f5fbf3] p-6 border-b border-[#e5ede0]">
          <CardTitle className="text-[#3d5a36]">Data Preview</CardTitle>
          <CardDescription className="text-[#556d4a]">A quick snapshot of recent SMS activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity Date</TableHead>
                <TableHead>Total Logs</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.dailyVolume?.length > 0 ? (
                data.dailyVolume.map((row: any) => (
                  <TableRow key={row.date} className="hover:bg-[#eff7ed] transition-colors duration-200">
                    <TableCell className="font-medium text-[#3d5a36]">{row.date}</TableCell>
                    <TableCell className="text-[#556d4a]">{row.count} messages</TableCell>
                    <TableCell><span className="text-[#5d8044] font-medium">Synced</span></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-gray-400">
                    No data found in anialerto.sms_logs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
