import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Layers, Users, MessageSquare, CheckCircle, Bell, RefreshCw } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";

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
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-12 w-12 text-[#5d8044] mb-4" />
        </motion.div>
        <motion.p 
          className="text-[#556d4a] font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Loading AniAlerto Data...
        </motion.p>
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
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-4">
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 text-[#3d5a36]">AniAlerto Dashboard</h1>
          <p className="text-[#556d4a]">Live overview from system database</p>
        </div>
        <motion.div 
          className="bg-[#5d8044]/10 text-[#5d8044] px-4 py-2 rounded-full text-sm font-medium border border-[#5d8044]/20 shadow-lg shadow-[#5d8044]/10"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          Live System Connected
        </motion.div>
      </motion.div>

      {/* Database Alerts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
          <CardHeader className="pb-2 bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
            <CardTitle className="text-lg flex items-center gap-2 text-[#3d5a36]">
              <Bell className="h-5 w-5 text-[#5d8044]" />
              Live Agricultural Advisories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-[#556d4a] italic">No critical alerts detected.</p>
              ) : (
                alerts.map((alert, index) => (
                  <motion.div 
                    key={alert.alert_id} 
                    className="flex items-center justify-between p-4 bg-[#f8fdf3] rounded-[1rem] border border-[#e5ede0] shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${alert.alert_level === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <p className="text-sm font-medium text-[#3d5a36]">{alert.alert_message}</p>
                    </div>
                    <span className="text-xs text-[#556d4a]">{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3] hover:shadow-3xl hover:shadow-[#a4c692]/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[#556d4a]">{stat.title}</CardTitle>
                  <div className="p-3 bg-[#5d8044]/10 rounded-full shadow-sm">
                    <Icon className="h-5 w-5 text-[#5d8044]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#3d5a36]">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Visualization Charts using DB Data */}
      <motion.div 
        className="grid lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
              <CardTitle className="text-[#3d5a36]">Message Activity (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dbStats.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ede0" />
                  <XAxis dataKey="date" stroke="#556d4a" />
                  <YAxis stroke="#556d4a" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#f8fdf3', 
                      border: '1px solid #d9ead6',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 25px rgba(164, 198, 146, 0.2)'
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#5d8044" strokeWidth={3} name="Total Logs" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="border border-[#d9ead6] shadow-2xl shadow-[#a4c692]/20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-white to-[#f8fdf3]">
            <CardHeader className="bg-gradient-to-r from-[#f5fbf3] to-[#f0f8eb] border-b border-[#e5ede0]">
              <CardTitle className="text-[#3d5a36]">Batch Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dbStats.batchStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {dbStats.batchStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#f8fdf3', 
                      border: '1px solid #d9ead6',
                      borderRadius: '0.5rem',
                      boxShadow: '0 10px 25px rgba(164, 198, 146, 0.2)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}