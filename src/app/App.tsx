import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ScrollToTop } from "./components/ScrollToTop";
import { PublicLayout } from "./components/PublicLayout";
import { AdminLayout } from "./components/AdminLayout";
import { HomePage } from "./components/HomePage";
import { AboutPage } from "./components/AboutPage";
import { CornGuidePage } from "./components/CornGuidePage";
import { FarmTourPage } from "./components/FarmTourPage";
import { Dashboard } from "./components/Dashboard";
import { BatchManagement } from "./components/BatchManagement";
import { WorkerManagement } from "./components/WorkerManagement";
import { MessageConfiguration } from "./components/MessageConfiguration";
import { SMSMonitoring } from "./components/SMSMonitoring";
import { Reports } from "./components/Reports";
import { CropCalendar } from "./components/CropCalendar";

interface Alert {
  alert_id: number;
  alert_level: string;
  alert_message: string;
  created_at: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("anialerto_auth") === "true";
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch('http://localhost/anialerto-backend/src/get_alerts.php')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Alerts request failed with ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Backend connection error:', error));
  }, []);

  const handleLogin = () => {
    localStorage.setItem("anialerto_auth", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("anialerto_auth");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes — homepage is always the default landing page */}
        <Route element={<PublicLayout onLogin={handleLogin} isAuthenticated={isAuthenticated} />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="corn-guide" element={<CornGuidePage />} />
          <Route path="farm-tour" element={<FarmTourPage />} />
        </Route>

        {/* Admin Routes — protected, redirect to home if not authenticated */}
        <Route
          path="admin"
          element={
            isAuthenticated ? (
              <AdminLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route path="dashboard" element={<Dashboard alerts={alerts} />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="workers" element={<WorkerManagement />} />
          <Route path="messages" element={<MessageConfiguration />} />
          <Route path="monitoring" element={<SMSMonitoring />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calendar" element={<CropCalendar />} />
          <Route path="responses" element={<Navigate to="../monitoring" replace />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch all — redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
