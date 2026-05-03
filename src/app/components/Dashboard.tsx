import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Layers, Users, MessageSquare, CheckCircle, Bell, RefreshCw } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("http://localhost/anialerto-backend/src/dashboard_stats.php");
        const data = await response.json();
        setDbStats(data);
      } catch (error) {
        console.error("Dashboard sync error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !dbStats) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="h-10 w-10 animate-spin text-[#8acb88] mb-4" />
        <p className="text-gray-500">Loading AniAlerto Data...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Farm Batches",
      value: dbStats.counts.batches,
      icon: Layers,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Registered Workers",
      value: dbStats.counts.workers,
      icon: Users,
      color: "text-[#8acb88]",
      bgColor: "bg-[#e4fde1]",
    },
    {
      title: "Total Logs Today",
      value: dbStats.counts.messages_today,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Completion Rate",
      value: `${dbStats.counts.completion_rate}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">AniAlerto Dashboard</h1>
          <p className="text-gray-600">Live overview from system database</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
          Live System Connected
        </div>
      </div>

      {/* Database Alerts Section */}
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
              <p className="text-sm text-gray-500 italic">No critical alerts detected.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.alert_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${alert.alert_level === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <p className="text-sm font-medium text-gray-800">{alert.alert_message}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
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

      {/* Visualization Charts using DB Data */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Activity (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dbStats.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8acb88" strokeWidth={3} name="Total Logs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={dbStats.batchStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {dbStats.batchStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}