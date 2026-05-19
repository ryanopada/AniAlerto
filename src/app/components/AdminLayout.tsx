import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Layers, Users, MessageSquare, Activity, FileText, LogOut, Menu, X, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface AdminLayoutProps {
  onLogout: () => void;
  unreadCount?: number;
  onAlertsRead?: () => void;
}

export function AdminLayout({ onLogout, unreadCount = 0 }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/batches",   icon: Layers,          label: "Farm Batches" },
    { path: "/admin/workers",   icon: Users,           label: "Workers" },
    { path: "/admin/messages",  icon: MessageSquare,   label: "Messages" },
    { path: "/admin/monitoring",icon: Activity,        label: "SMS Monitoring" },
    { path: "/admin/reports",   icon: FileText,        label: "Reports" },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F2]">
      {/* Top Header */}
      <header className="bg-[#97ae5f] sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <img 
  src="/anialerto-logo.svg" 
  alt="AniAlerto Logo" 
  className="h-9 w-auto object-contain" 
/>
              <span className="font-bold text-white text-xl">AniAlerto Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-white hidden sm:inline">Administrator</span>
            {/* Notification Bell */}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="relative text-white hover:text-green-200 transition-colors"
              title="View alerts"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="bg-[#556B2F] hover:bg-[#91b554] text-white border-none rounded-full"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white/80 backdrop-blur border-r border-white/20  h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto flex-shrink-0">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
  ? "bg-[#97ae5f]/20 text-[#556B2F] font-semibold"
  : "text-gray-700 hover:bg-[#97ae5f]/10"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 bg-white z-40 border-r overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-[#e4fde1] text-[#8acb88] font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
