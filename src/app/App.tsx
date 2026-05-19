import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ScrollToTop } from "./components/ScrollToTop";
import { PublicLayout } from "./components/PublicLayout";
import { AdminLayout } from "./components/AdminLayout";
import { LoginPage } from "./components/LoginPage";
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


interface Alert {
  id: number;
  type: string;
  worker_id: number | null;
  worker_name: string | null;
  phone: string | null;
  task_id: number | null;
  message: string | null;
  is_read: number;
  created_at: string;
}

export default function App() {
  // Read from localStorage on every render so a page refresh always honours
  // the persisted token, regardless of React state initialization order.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("anialerto_auth") === "true";
  });

  // Keep state in sync if another tab logs out
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "anialerto_auth") {
        setIsAuthenticated(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost/anialerto-backend/src/get_alerts.php');
      if (!res.ok) throw new Error(`Alerts failed: ${res.status}`);
      const data = await res.json();
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      setUnreadCount(data.unread_count ?? 0);
    } catch (e) {
      console.error('Backend connection error:', e);
    }
  };

  // Called by Dashboard when admin resolves an alert — newCount comes straight
  // from the POST response so the bell updates without waiting for next poll
  const handleAlertsRead = (newCount?: number) => {
    if (typeof newCount === 'number') {
      setUnreadCount(newCount);
    }
    fetchAlerts(); // also sync the full alerts list
  };


  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 10_000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);


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

        {/* Dedicated full-page login — accessible only when NOT authenticated */}
        <Route
          path="admin/login"
          element={
            isAuthenticated
              ? <Navigate to="/admin/dashboard" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Admin Routes — protected, redirect to login page if not authenticated */}
        <Route
          path="admin"
          element={
            isAuthenticated ? (
              <AdminLayout onLogout={handleLogout} unreadCount={unreadCount} onAlertsRead={handleAlertsRead} />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          <Route path="dashboard" element={<Dashboard alerts={alerts} onAlertsRead={handleAlertsRead} />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="workers" element={<WorkerManagement />} />
          <Route path="messages" element={<MessageConfiguration />} />
          <Route path="monitoring" element={<SMSMonitoring />} />
          <Route path="reports"    element={<Reports />} />
          <Route path="responses" element={<Navigate to="../monitoring" replace />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch all — redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
