import { useState } from "react";
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

        {/* Admin Routes */}
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="workers" element={<WorkerManagement />} />
          <Route path="messages" element={<MessageConfiguration />} />
          <Route path="monitoring" element={<SMSMonitoring />} />
          <Route path="reports" element={<Reports />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}