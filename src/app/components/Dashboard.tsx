import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Layers, Users, MessageSquare, CheckCircle, Bell, Loader2 } from "lucide-react";
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

  const stats = dbStats ? {
    batches: dbStats.counts.batches,
    workers: dbStats.counts.workers,
    messages_today: dbStats.counts.messages_today,
    completion_rate: dbStats.counts.completion_rate
  } : {
    batches: 0,
    workers: 0,
    messages_today: 0,
    completion_rate: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3faf2] via-[#f9fcf7] to-[#eff7eb] space-y-6 p-6 max-w-7xl mx-auto">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#3d5a36]">AniAlerto Dashboard</h1>
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
        transition={{ duration: 0.6, delay: 0.3 }}
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {loading ? (
          <div className="col-span-full flex justify-center p-8">
            <Loader2 className="animate-spin text-[#5d8044] h-8 w-8" />
          </div>
        ) : (
          <>
            <StatCard title="Active Farm Batches" value={stats.batches} icon={<Layers />} color="border-l-[#5d8044]" textColor="text-[#3d5a36]" />
            <StatCard title="Registered Workers" value={stats.workers} icon={<Users />} color="border-l-[#5d8044]" textColor="text-[#5d8044]" />
            <StatCard title="Total Logs Today" value={stats.messages_today} icon={<MessageSquare />} color="border-l-[#8acb88]" textColor="text-[#8acb88]" />
            <StatCard title="Completion Rate" value={`${stats.completion_rate}%`} icon={<CheckCircle />} color="border-l-[#ffbf46]" textColor="text-[#ffbf46]" />
          </>
        )}
      </motion.div>

      {/* Visualization Charts using DB Data */}
      <motion.div
        className="grid lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
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
              {loading || !dbStats ? (
                <div className="flex justify-center items-center h-[300px]">
                  <Loader2 className="animate-spin text-[#5d8044] h-8 w-8" />
                </div>
              ) : (
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
              )}
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
              {loading || !dbStats ? (
                <div className="flex justify-center items-center h-[300px]">
                  <Loader2 className="animate-spin text-[#5d8044] h-8 w-8" />
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: any) {
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