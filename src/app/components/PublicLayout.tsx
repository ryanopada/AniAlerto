import { Link, Outlet } from "react-router";
import { Menu, X, ShieldCheck, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

interface PublicLayoutProps {
  onLogin?: () => void;
  isAuthenticated?: boolean;
}

export function PublicLayout({ onLogin, isAuthenticated }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const openLoginModal = () => {
    setLoginModalOpen(true);
    setMobileMenuOpen(false);
    setError("");
    setUsername("");
    setPassword("");
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (username && password) {
      if (username === "admin" && password === "@dmin123") {
        localStorage.setItem("anialerto_auth", "true");
        onLogin?.();
        closeLoginModal();
        navigate("/admin/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } else {
      setError("Please enter both username and password");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F2]">
      {/* Navbar */}
      <header className="bg-[#97ae5f] sticky top-0 z-50 shadow-md transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/anialerto-logo.svg"
                alt="AniAlerto Logo"
                className="h-9 w-auto object-contain"
              />
              <span className="font-bold text-xl text-white tracking-tight">AniAlerto</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-white hover:text-[#F1F5F2] transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-sm font-medium text-white hover:text-[#F1F5F2] transition-colors">
                About
              </Link>
              <Link to="/corn-guide" className="text-sm font-medium text-white hover:text-[#F1F5F2] transition-colors">
                Farming Guide
              </Link>
              <Link to="/farm-tour" className="text-sm font-medium text-white hover:text-[#F1F5F2] transition-colors">
                The Farm
              </Link>

              {isAuthenticated ? (
                <Link to="/admin/dashboard">
                  <Button size="sm" className="bg-[#556B2F] hover:bg-[#91b554] text-white border-none shadow-sm rounded-full">
                    Admin Dashboard
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={openLoginModal}
                  className="bg-[#556B2F] hover:bg-[#91b554] text-white border-none shadow-sm rounded-full"
                >
                  Admin Login
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-6 flex flex-col gap-4 border-t border-white/20 animate-in fade-in slide-in-from-top-4">
              <Link
                to="/"
                className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/corn-guide"
                className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Farming Guide
              </Link>
              <Link
                to="/farm-tour"
                className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                The Farm
              </Link>
              {isAuthenticated ? (
                <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="lg" className="bg-[#556B2F] hover:bg-[#91b554] text-white w-full mt-2">
                    Admin Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={openLoginModal} className="bg-[#556B2F] hover:bg-[#91b554] text-white w-full mt-2">
                  Admin Login
                </Button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img
                  src="/anialerto-logo.svg"
                  alt="AniAlerto Logo"
                  className="h-7 w-auto object-contain"
                />
                <span className="font-bold text-xl tracking-tight text-white">AniAlerto</span>
              </div>
              <p className="text-sm text-[#777] leading-relaxed">
                Empowering Filipino farmers through automated, rule-based SMS advisory for precision corn management.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Contact Us</h3>
              <p className="text-sm text-[#777] mb-2">Email: info@anialerto.com</p>
              <p className="text-sm text-[#777]">Phone: +63 123 456 7890</p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Quick Links</h3>
              <div className="flex flex-col gap-3">
                <Link to="/" className="text-sm text-[#777] hover:text-[#97ae5f] transition-colors">Home</Link>
                <Link to="/about" className="text-sm text-[#777] hover:text-[#97ae5f] transition-colors">About AniAlerto</Link>
                <Link to="/corn-guide" className="text-sm text-[#777] hover:text-[#97ae5f] transition-colors">Corn Farming Guide</Link>
                <Link to="/farm-tour" className="text-sm text-[#777] hover:text-[#97ae5f] transition-colors">Explore the Farm</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 text-center text-xs text-[#777] tracking-widest uppercase">
            <p>&copy; 2026 AniAlerto. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Admin Login Modal ── */}
      <AnimatePresence>
        {loginModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeLoginModal}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              className="fixed inset-0 z-[110] flex items-center justify-center px-4"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="w-full max-w-md">
                {/* Close button */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={closeLoginModal}
                    className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors backdrop-blur-sm"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Logo + Title */}
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#d9ead6] bg-white shadow-2xl shadow-[#a4c692]/20">
                    <img
                      src="/anialerto-logo2.svg"
                      alt="AniAlerto Logo"
                      className="h-11 w-11 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/anialerto-logo.svg"; }}
                    />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1">AniAlerto Admin</h2>
                  <p className="text-white/80 text-sm">Sign in to manage farm alerts and SMS activity</p>
                </div>

                {/* Card */}
                <div className="overflow-hidden rounded-[1.5rem] border border-[#d9ead6] bg-white shadow-2xl shadow-[#2f4a25]/30">
                  <div className="border-b border-[#e5ede0] bg-[#f5fbf3] px-6 py-4 text-center">
                    <h3 className="flex items-center justify-center gap-2 text-lg font-semibold text-[#3d5a36]">
                      <ShieldCheck className="w-5 h-5 text-[#5d8044]" />
                      Admin Login
                    </h3>
                    <p className="text-sm text-[#556d4a] mt-0.5">Enter your credentials to access the administrative dashboard</p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="modal-username" className="text-sm font-medium text-[#3d5a36]">Username</Label>
                      <Input
                        id="modal-username"
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="rounded-xl border-[#d9ead6] bg-white px-3 py-3 text-[#3d5a36] shadow-sm placeholder:text-[#7b8f6f] focus:border-[#5d8044] focus:ring-[#5d8044]"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modal-password" className="text-sm font-medium text-[#3d5a36]">Password</Label>
                      <Input
                        id="modal-password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-xl border-[#d9ead6] bg-white px-3 py-3 text-[#3d5a36] shadow-sm placeholder:text-[#7b8f6f] focus:border-[#5d8044] focus:ring-[#5d8044]"
                        disabled={isLoading}
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full rounded-xl border border-[#7a9b5c] bg-[#5d8044] py-3 font-medium text-white shadow-lg shadow-[#5d8044]/20 hover:bg-[#4a6b36] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                <p className="mt-4 text-center text-xs text-white/70">
                  Secure access to AniAlerto administrative features
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}