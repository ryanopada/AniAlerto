import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Layers, Users, MessageSquare, CheckCircle, Clock, AlertCircle, Bell } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Define the interface for the real database alerts
interface Alert {
  alert_id: number;
  alert_level: string;
  alert_message: string;
  created_at: string;
}

interface DashboardProps {
  alerts: Alert[];
}

export function Dashboard({ alerts }: DashboardProps) {
  // Stats derived from mock data (you can later connect these to PHP counts)
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
      value: String(156 + alerts.length), // Including real alerts count
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

  // Chart and Mock Data
  const taskCompletionTrend = [
    { date: "Apr 26", completed: 65, total: 75 },
    { date: "Apr 27", completed: 72, total: 80 },
    { date: "Apr 28", completed: 68, total: 78 },
    { date: "Apr 29", completed: 80, total: 90 },
    { date: "Apr 30", completed: 85, total: 95 },
    { date: "May 1", completed: 88, total: 98 },
    { date: "May 2", completed: 92, total: 100 },
  ];

  const batchStatusData = [
    { name: "Active", value: 12, color: "#8acb88" },
    { name: "Harvested", value: 8, color: "#648381" },
    { name: "Planning", value: 5, color: "#ffbf46" },
    { name: "Delayed", value: 2, color: "#d4183d" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">AniAlerto Dashboard</h1>
          <p className="text-gray-600">Overview of farm management and crop advisories</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium animate-pulse">
          Live System Connected
        </div>
      </div>

      {/* NEW: Live Database Alerts Section */}
      <Card className="border-l-4 border-emerald-500 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600" />
            Live Agricultural Advisories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No critical alerts detected by AniAlerto scheduler.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.alert_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${alert.alert_level === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <p className="text-sm font-medium text-gray-800">{alert.alert_message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#8acb88" strokeWidth={3} name="Completed Tasks" dot={{ fill: '#8acb88', r: 4 }} />
                <Line type="monotone" dataKey="total" stroke="#648381" strokeWidth={2} strokeDasharray="5 5" name="Total Tasks" dot={{ fill: '#648381', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={batchStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {batchStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}