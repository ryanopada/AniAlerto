import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Layers, Users, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function Dashboard() {
  // Mock data
  const stats = [
    {
      title: "Active Farm Batches",
      value: "12",
      icon: Layers,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Registered Workers",
      value: "48",
      icon: Users,
      color: "text-[#8acb88]",
      bgColor: "bg-[#e4fde1]",
    },
    {
      title: "Messages Sent Today",
      value: "156",
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Tasks Completed",
      value: "89%",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const recentActivities = [
    { type: "success", message: "Batch BR-2026-001 irrigation reminder sent to 8 workers", time: "2 hours ago" },
    { type: "warning", message: "3 workers reported DELAY for fertilization task", time: "3 hours ago" },
    { type: "success", message: "New worker Juan Dela Cruz registered", time: "5 hours ago" },
    { type: "info", message: "Weekly report generated successfully", time: "1 day ago" },
    { type: "success", message: "Batch BR-2026-002 created for Field A", time: "1 day ago" },
  ];

  const upcomingTasks = [
    { batch: "BR-2026-001", task: "Second fertilization", dueDate: "March 7, 2026", workers: 8 },
    { batch: "BR-2026-003", task: "Pest monitoring", dueDate: "March 8, 2026", workers: 6 },
    { batch: "BR-2026-002", task: "Irrigation check", dueDate: "March 9, 2026", workers: 5 },
    { batch: "BR-2026-004", task: "First fertilization", dueDate: "March 10, 2026", workers: 7 },
  ];

  // Chart data
  const taskCompletionTrend = [
    { date: "Feb 27", completed: 65, total: 75 },
    { date: "Feb 28", completed: 72, total: 80 },
    { date: "Mar 1", completed: 68, total: 78 },
    { date: "Mar 2", completed: 80, total: 90 },
    { date: "Mar 3", completed: 85, total: 95 },
    { date: "Mar 4", completed: 88, total: 98 },
    { date: "Mar 5", completed: 92, total: 100 },
  ];

  const batchStatusData = [
    { name: "Active", value: 12, color: "#8acb88" },
    { name: "Harvested", value: 8, color: "#648381" },
    { name: "Planning", value: 5, color: "#ffbf46" },
    { name: "Delayed", value: 2, color: "#d4183d" },
  ];

  const workerActivityData = [
    { name: "Irrigation", tasks: 45, completed: 42 },
    { name: "Fertilization", tasks: 38, completed: 35 },
    { name: "Pest Control", tasks: 32, completed: 30 },
    { name: "Monitoring", tasks: 28, completed: 26 },
    { name: "Harvesting", tasks: 15, completed: 15 },
  ];

  const messageResponseData = [
    { response: "DONE", count: 125 },
    { response: "DELAY", count: 18 },
    { response: "HELP", count: 8 },
    { response: "No Response", count: 5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of farm management system activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Visualization Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={taskCompletionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#8acb88" 
                  strokeWidth={3}
                  name="Completed Tasks"
                  dot={{ fill: '#8acb88', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#648381" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Total Tasks"
                  dot={{ fill: '#648381', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Batch Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batchStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {batchStatusData.map((entry, index) => (
                    <Cell key={`batch-status-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Worker Activity by Task Type */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Activity by Task Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workerActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="tasks" fill="#648381" name="Total Tasks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#8acb88" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message Response Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Message Response Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={messageResponseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis dataKey="response" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" name="Messages" radius={[0, 4, 4, 0]}>
                  {messageResponseData.map((entry, index) => (
                    <Cell
                      key={`message-response-${entry.response}-${index}`}
                      fill={
                        entry.response === 'DONE' ? '#8acb88' :
                        entry.response === 'DELAY' ? '#ffbf46' :
                        entry.response === 'HELP' ? '#d4183d' :
                        '#6b7280'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={`activity-${index}`} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === "success" && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {activity.type === "warning" && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    {activity.type === "info" && (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <div key={`task-${task.batch}-${index}`} className="border-l-4 border-green-600 pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm">{task.task}</h4>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      {task.workers} workers
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Batch: {task.batch}</p>
                  <p className="text-xs text-gray-500 mt-1">Due: {task.dueDate}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
