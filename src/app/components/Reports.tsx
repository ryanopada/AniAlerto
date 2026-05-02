import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { FileText, Download, Calendar, TrendingUp, Users, MessageSquare } from "lucide-react";

export function Reports() {
  const [reportType, setReportType] = useState<"messages" | "tasks" | "workers" | "batches">("messages");
  const [dateRange, setDateRange] = useState({
    from: "2026-03-01",
    to: "2026-03-05",
  });

  const handleGenerateReport = () => {
    alert(`Generating ${reportType} report for ${dateRange.from} to ${dateRange.to}`);
  };

  const handleDownloadReport = (format: "PDF" | "Excel") => {
    alert(`Downloading report as ${format}`);
  };

  // Mock data for different reports
  const messageReport = [
    { date: "2026-03-05", sent: 45, done: 38, delay: 5, help: 2, pending: 0 },
    { date: "2026-03-04", sent: 52, done: 47, delay: 3, help: 1, pending: 1 },
    { date: "2026-03-03", sent: 38, done: 35, delay: 2, help: 0, pending: 1 },
    { date: "2026-03-02", sent: 41, done: 39, delay: 1, help: 1, pending: 0 },
    { date: "2026-03-01", sent: 36, done: 33, delay: 2, help: 0, pending: 1 },
  ];

  const taskReport = [
    { task: "Irrigation Check", total: 48, completed: 45, pending: 3, rate: "94%" },
    { task: "Fertilizer Application", total: 36, completed: 32, pending: 4, rate: "89%" },
    { task: "Pest Monitoring", total: 24, completed: 22, pending: 2, rate: "92%" },
    { task: "Weed Control", total: 28, completed: 26, pending: 2, rate: "93%" },
  ];

  const workerReport = [
    { name: "Juan Dela Cruz", assigned: 12, completed: 11, rate: "92%" },
    { name: "Maria Santos", assigned: 10, completed: 10, rate: "100%" },
    { name: "Pedro Reyes", assigned: 11, completed: 9, rate: "82%" },
    { name: "Ana Garcia", assigned: 9, completed: 8, rate: "89%" },
    { name: "Jose Martinez", assigned: 10, completed: 9, rate: "90%" },
  ];

  const batchReport = [
    { batch: "BR-2026-001", workers: 8, tasks: 24, completed: 22, rate: "92%" },
    { batch: "BR-2026-002", workers: 6, tasks: 18, completed: 16, rate: "89%" },
    { batch: "BR-2026-003", workers: 7, tasks: 21, completed: 19, rate: "90%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports and Logs</h1>
        <p className="text-gray-600">Generate comprehensive reports on farm activities</p>
      </div>

      {/* Report Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Messages Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">212</p>
            <p className="text-xs text-gray-500">Total messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">89%</p>
            <p className="text-xs text-gray-500">Average completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <Users className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">48</p>
            <p className="text-xs text-gray-500">Workers responding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <MessageSquare className="h-8 w-8 text-orange-600 mb-2" />
            <CardTitle className="text-sm font-medium text-gray-600">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">95%</p>
            <p className="text-xs text-gray-500">Workers responding</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Task completion rate improved</p>
                <p className="text-xs text-gray-600">Up 5% from last week</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Worker response time decreased</p>
                <p className="text-xs text-gray-600">Average response in 2.5 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">All workers actively responding</p>
                <p className="text-xs text-gray-600">100% participation this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">3 delayed tasks in BR-2026-002</p>
                <p className="text-xs text-gray-600">Follow up with workers needed</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">2 help requests pending</p>
                <p className="text-xs text-gray-600">Workers need assistance with pest control</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <Users className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">1 worker below 85% completion</p>
                <p className="text-xs text-gray-600">Training or support may be needed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
              >
                <option value="messages">Messages Sent Report</option>
                <option value="tasks">Task Completion Report</option>
                <option value="workers">Worker Performance Report</option>
                <option value="batches">Batch Activity Report</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 border rounded-md px-3 py-2"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
                <span className="flex items-center">to</span>
                <input
                  type="date"
                  className="flex-1 border rounded-md px-3 py-2"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGenerateReport} className="bg-[#8acb88] hover:bg-[#648381]">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => handleDownloadReport("PDF")}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={() => handleDownloadReport("Excel")}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>
            {reportType === "messages" && "Messages sent and worker responses by date"}
            {reportType === "tasks" && "Task completion status by activity type"}
            {reportType === "workers" && "Worker performance and task completion rates"}
            {reportType === "batches" && "Farm batch activities and completion rates"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {reportType === "messages" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Messages Sent</TableHead>
                    <TableHead>Done</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Help</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Response Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messageReport.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(row.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{row.sent}</TableCell>
                      <TableCell className="text-green-600 font-medium">{row.done}</TableCell>
                      <TableCell className="text-yellow-600">{row.delay}</TableCell>
                      <TableCell className="text-red-600">{row.help}</TableCell>
                      <TableCell className="text-gray-600">{row.pending}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {Math.round(((row.done + row.delay + row.help) / row.sent) * 100)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "tasks" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Type</TableHead>
                    <TableHead>Total Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskReport.map((row) => (
                    <TableRow key={row.task}>
                      <TableCell className="font-medium">{row.task}</TableCell>
                      <TableCell>{row.total}</TableCell>
                      <TableCell className="text-green-600">{row.completed}</TableCell>
                      <TableCell className="text-gray-600">{row.pending}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: row.rate }}
                            />
                          </div>
                          <span className="font-medium">{row.rate}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "workers" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker Name</TableHead>
                    <TableHead>Tasks Assigned</TableHead>
                    <TableHead>Tasks Completed</TableHead>
                    <TableHead>Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workerReport.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          {row.name}
                        </div>
                      </TableCell>
                      <TableCell>{row.assigned}</TableCell>
                      <TableCell className="text-green-600">{row.completed}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: row.rate }}
                            />
                          </div>
                          <span className="font-medium">{row.rate}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "batches" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Workers</TableHead>
                    <TableHead>Total Tasks</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchReport.map((row) => (
                    <TableRow key={row.batch}>
                      <TableCell className="font-medium">{row.batch}</TableCell>
                      <TableCell>{row.workers}</TableCell>
                      <TableCell>{row.tasks}</TableCell>
                      <TableCell className="text-green-600">{row.completed}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: row.rate }}
                            />
                          </div>
                          <span className="font-medium">{row.rate}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
