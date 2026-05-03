import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ScrollToTop } from "./components/ScrollToTop";
import { PublicLayout } from "./components/PublicLayout";
import { AdminLayout } from "./components/AdminLayout";
import { HomePage } from "./components/HomePage";
import { AboutPage } from "./components/AboutPage";
import { CornGuidePage } from "./components/CornGuidePage";
import { FarmTourPage } from "./components/FarmTourPage";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { BatchManagement } from "./components/BatchManagement";
import { WorkerManagement } from "./components/WorkerManagement";
import { MessageConfiguration } from "./components/MessageConfiguration";
import { SMSMonitoring } from "./components/SMSMonitoring";
import { Reports } from "./components/Reports";

interface Alert {
  alert_id: number;
  alert_level: string;
  alert_message: string;
  created_at: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch('http://localhost/anialerto-backend/src/get_alerts.php')
      .then((response) => response.json())
      .then((data) => setAlerts(data))
      .catch((error) => console.error('Backend connection error:', error));
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="corn-guide" element={<CornGuidePage />} />
          <Route path="farm-tour" element={<FarmTourPage />} />
          
          {/* Login Route */}
          <Route 
            path="login" 
            element={
              isAuthenticated ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            } 
          />
        </Route>

        {/* Admin Routes - Data is passed to Dashboard and Monitoring */}
        <Route
          path="admin"
          element={
            isAuthenticated ? (
              <AdminLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* We pass the 'alerts' data as props to the Dashboard */}
          <Route path="dashboard" element={<Dashboard alerts={alerts} />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="workers" element={<WorkerManagement />} />
          <Route path="messages" element={<MessageConfiguration />} />
          <Route path="monitoring" element={<SMSMonitoring alerts={alerts} />} />
          <Route path="reports" element={<Reports />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}