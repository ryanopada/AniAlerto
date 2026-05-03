import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { FileText, Download, Calendar, TrendingUp, Users, MessageSquare, RefreshCw, AlertCircle } from "lucide-react";

export function Reports() {
  const [reportType, setReportType] = useState<"messages" | "tasks" | "workers">("messages");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
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
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports and Logs</h1>
          <p className="text-gray-600">Database-driven insights from your SMS activity</p>
        </div>
        <Button variant="outline" onClick={fetchReportData} className="border-[#8acb88] text-[#648381]">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Connection Error: {error}. Please check if XAMPP is running.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.total || 0}</p>
            <p className="text-xs text-gray-500">All logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.completionRate || 0}%</p>
            <p className="text-xs text-gray-500">Tasks 'DONE'</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Users className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.summary?.activeWorkers || 0}</p>
            <p className="text-xs text-gray-500">Involved in logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <FileText className="h-8 w-8 text-orange-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Help Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{data?.summary?.helpRequests || 0}</p>
            <p className="text-xs text-gray-500">Urgent responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Configuration */}
      <Card className="border-[#8acb88]">
        <CardHeader>
          <CardTitle>Report Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data View</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
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
                <input type="date" className="flex-1 border rounded-md px-3 py-2 text-sm" value={dateRange.from} readOnly />
                <input type="date" className="flex-1 border rounded-md px-3 py-2 text-sm" value={dateRange.to} readOnly />
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" /> Print PDF Report
          </Button>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
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
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>{row.count} messages</TableCell>
                    <TableCell><span className="text-green-600">Synced</span></TableCell>
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