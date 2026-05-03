import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AlertCircle, LogIn, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

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

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (username && password) {
      if (username === "admin" && password === "@dmin123") {
        onLogin();
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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3faf2] bg-cover bg-center px-4 py-16"
      style={{ backgroundImage: "url('/anialerto-login-bg.svg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#556b2f]/62 via-[#5d8044]/48 to-[#91b554]/54" />
      <div className="absolute inset-0 bg-[#173114]/18" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.45, type: "spring", stiffness: 180 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#d9ead6] bg-white shadow-2xl shadow-[#a4c692]/20"
          >
            <img
              src="/anialerto-logo2.svg"
              alt="AniAlerto Logo"
              className="h-14 w-14 object-contain"
            />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2 text-white">
            AniAlerto Admin
          </h1>
          <p className="text-white text-lg">Sign in to manage farm alerts and SMS activity</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="overflow-hidden rounded-[1.5rem] border border-[#d9ead6] bg-gradient-to-br from-white/95 to-[#f8fdf3]/95 shadow-2xl shadow-[#2f4a25]/20 backdrop-blur-md">
            <CardHeader className="border-b border-[#e5ede0] bg-[#f5fbf3]/90 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl text-[#3d5a36]">
                <ShieldCheck className="w-5 h-5 text-[#5d8044]" />
                Admin Login
              </CardTitle>
              <CardDescription className="text-[#556d4a]">
                Enter your credentials to access the administrative dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="username" className="text-sm font-medium text-[#3d5a36]">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-xl border-[#d9ead6] bg-white px-3 py-3 text-[#3d5a36] shadow-sm transition-all duration-200 placeholder:text-[#7b8f6f] focus:border-[#5d8044] focus:ring-[#5d8044]"
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-sm font-medium text-[#3d5a36]">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-[#d9ead6] bg-white px-3 py-3 text-[#3d5a36] shadow-sm transition-all duration-200 placeholder:text-[#7b8f6f] focus:border-[#5d8044] focus:ring-[#5d8044]"
                    disabled={isLoading}
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    className="w-full rounded-xl border border-[#7a9b5c] bg-[#5d8044] py-3 font-medium text-white shadow-lg shadow-[#5d8044]/20 transition-all duration-200 hover:bg-[#4a6b36] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
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
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 text-center text-sm text-white"
        >
          Secure access to AniAlerto administrative features
        </motion.p>
      </motion.div>
    </div>
  );
}
