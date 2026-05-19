import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle, LogIn, Loader2, ShieldCheck, Leaf, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { flushSync } from "react-dom";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 700));

    if (!username || !password) {
      setError("Please enter both username and password.");
      setIsLoading(false);
      return;
    }

    if (username === "admin" && password === "@dmin123") {
      // flushSync ensures auth state is committed BEFORE navigate() fires,
      // preventing the protected route guard from bouncing back to /admin/login.
      flushSync(() => {
        localStorage.setItem("anialerto_auth", "true");
        onLogin();
      });
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError("Invalid username or password. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center px-4 py-16"
      style={{ backgroundImage: "url('/anialerto-login-bg.svg')" }}
    >
      {/* Semi-transparent green tint overlay */}
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(45, 90, 30, 0.45)" }} />

      {/* Decorative leaf accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Leaf className="absolute top-[8%] left-[5%] h-32 w-32 text-white/10 rotate-[-20deg]" />
        <Leaf className="absolute top-[15%] right-[8%] h-24 w-24 text-white/8 rotate-[35deg]" />
        <Leaf className="absolute bottom-[12%] left-[10%] h-40 w-40 text-white/8 rotate-[15deg]" />
        <Leaf className="absolute bottom-[8%] right-[5%] h-28 w-28 text-white/10 rotate-[-30deg]" />
      </div>

      {/* Back to site link */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to site
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Logo + heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-2xl ring-1 ring-white/20"
          >
            <img
              src="/anialerto-logo2.svg"
              alt="AniAlerto Logo"
              className="h-10 w-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = "/anialerto-logo.svg"; }}
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AniAlerto Admin</h1>
          <p className="mt-1 text-white/75 text-sm">Sign in to manage farm alerts and SMS activity</p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/8">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#5d8044] via-[#7aac58] to-[#a8c97a]" />

            {/* Header */}
            <div className="flex flex-col items-center px-8 pt-7 pb-5 text-center border-b border-gray-100">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <ShieldCheck className="h-5 w-5 text-[#5d8044]" />
                Admin Login
              </h2>
              <p className="mt-1 text-sm text-gray-500">Enter your credentials to access the dashboard</p>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-sm font-medium text-gray-700">
                  Username
                </Label>
                <Input
                  id="login-username"
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
                <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <Input
                  id="login-password"
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

              {/* Submit */}
              <Button
                type="submit"
                className="mt-1 w-full h-10 rounded-lg bg-[#5d8044] font-semibold text-white shadow-sm transition-all hover:bg-[#4a6b36] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
        </motion.div>

        {/* Bottom badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-4 flex justify-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm ring-1 ring-white/20">
            <Leaf className="h-3 w-3" />
            AniAlerto Farm Management System
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
