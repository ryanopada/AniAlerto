import { Link, Outlet } from "react-router";
import { Menu, X, ShieldCheck, LogIn, AlertCircle, Loader2, Leaf } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { flushSync } from "react-dom";

// Outlet context type — lets child routes (e.g. HomePage) open the login modal
export type PublicOutletContext = { openLoginModal: () => void };

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

    await new Promise((resolve) => setTimeout(resolve, 700));

    if (!username || !password) {
      setError("Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    if (username === "admin" && password === "@dmin123") {
      // ── Auth fix: flushSync ensures React processes the state update
      // (localStorage write + onLogin) BEFORE navigate() is called.
      // Without this, navigate fires while isAuthenticated is still false,
      // causing the protected route to redirect back to "/" in the same tick.
      flushSync(() => {
        localStorage.setItem("anialerto_auth", "true");
        onLogin?.();
        setLoginModalOpen(false);
      });
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError("Invalid username or password. Please try again.");
      setIsLoading(false);
    }
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
                  <Button size="sm" className="bg-[#556B2F] hover:bg-[#4a5e28] text-white border-none shadow-sm rounded-full">
                    Admin Dashboard
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={openLoginModal}
                  className="bg-[#556B2F] hover:bg-[#4a5e28] text-white border-none shadow-sm rounded-full"
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
              <Link to="/" className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/about" className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link to="/corn-guide" className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Farming Guide
              </Link>
              <Link to="/farm-tour" className="text-white font-medium hover:bg-white/10 p-2 rounded transition-colors" onClick={() => setMobileMenuOpen(false)}>
                The Farm
              </Link>
              {isAuthenticated ? (
                <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="lg" className="bg-[#556B2F] hover:bg-[#4a5e28] text-white w-full mt-2">
                    Admin Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" onClick={openLoginModal} className="bg-[#556B2F] hover:bg-[#4a5e28] text-white w-full mt-2">
                  Admin Login
                </Button>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet context={{ openLoginModal } satisfies PublicOutletContext} />
      </main>

      {/* Footer */}
      <footer className="bg-[#2C2C2C] text-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img src="/anialerto-logo.svg" alt="AniAlerto Logo" className="h-7 w-auto object-contain" />
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

      {/* ── Admin Login Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {loginModalOpen && (
          <>
            {/* Backdrop — rich green agricultural gradient, no harsh dark overlay */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-[100]"
              style={{
                background: "linear-gradient(135deg, rgba(26,58,16,0.88) 0%, rgba(42,82,28,0.84) 40%, rgba(55,100,38,0.82) 70%, rgba(30,70,20,0.88) 100%)",
                backdropFilter: "blur(3px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeLoginModal}
            />
            {/* Decorative leaves on the backdrop */}
            <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
              <Leaf className="absolute top-[8%] left-[5%] h-32 w-32 text-white/10 rotate-[-20deg]" />
              <Leaf className="absolute top-[15%] right-[8%] h-24 w-24 text-white/8 rotate-[35deg]" />
              <Leaf className="absolute bottom-[12%] left-[10%] h-40 w-40 text-white/8 rotate-[15deg]" />
              <Leaf className="absolute bottom-[8%] right-[5%] h-28 w-28 text-white/10 rotate-[-30deg]" />
            </div>

            {/* Modal wrapper */}
            <motion.div
              key="modal"
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative w-full max-w-[420px]">

                {/* ── Card ────────────────────────────────────────────────────── */}
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/8">

                  {/* Top accent bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#5d8044] via-[#7aac58] to-[#a8c97a]" />

                  {/* Close button */}
                  <button
                    onClick={closeLoginModal}
                    aria-label="Close login"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Header */}
                  <div className="flex flex-col items-center px-8 pt-8 pb-6 text-center">
                    {/* Logo pill */}
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f7eb] ring-1 ring-[#d2e8c4] shadow-sm">
                      <img
                        src="/anialerto-logo2.svg"
                        alt="AniAlerto"
                        className="h-9 w-9 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/anialerto-logo.svg"; }}
                      />
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                      Sign in to AniAlerto
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter your admin credentials to continue
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">

                    {/* Username */}
                    <div className="space-y-1.5">
                      <Label htmlFor="modal-username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <Input
                        id="modal-username"
                        type="text"
                        placeholder="admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-10 rounded-lg border-gray-200 bg-gray-50 px-3 text-gray-900 placeholder:text-gray-400 focus:border-[#5d8044] focus:bg-white focus:ring-1 focus:ring-[#5d8044] transition-all"
                        disabled={isLoading}
                        autoFocus
                        autoComplete="username"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="modal-password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <Input
                        id="modal-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 rounded-lg border-gray-200 bg-gray-50 px-3 text-gray-900 placeholder:text-gray-400 focus:border-[#5d8044] focus:bg-white focus:ring-1 focus:ring-[#5d8044] transition-all"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -4, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <Button
                      type="submit"
                      className="mt-2 w-full h-10 rounded-lg bg-[#5d8044] font-semibold text-white shadow-sm transition-all
                                 hover:bg-[#4a6b36] hover:shadow-md active:scale-[0.98]
                                 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        <>
                          <LogIn className="mr-2 h-4 w-4" />
                          Sign in
                        </>
                      )}
                    </Button>

                    {/* Secure badge */}
                    <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-gray-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#5d8044]" />
                      <span>Secure admin access · AniAlerto</span>
                    </div>
                  </form>
                </div>

                {/* Decorative leaf badge */}
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#5d8044] shadow-sm ring-1 ring-[#c8e0b0]/60 backdrop-blur-sm">
                    <Leaf className="h-3 w-3" />
                    AniAlerto Farm Management System
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}