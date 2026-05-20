import { Link, Outlet } from "react-router";
import { Menu, X, Leaf } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

// Outlet context type — lets child routes (e.g. HomePage) navigate to login page
export type PublicOutletContext = { openLoginModal: () => void };

interface PublicLayoutProps {
  onLogin?: () => void;
  isAuthenticated?: boolean;
}

export function PublicLayout({ isAuthenticated }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                <Link to="/admin/login">
                  <Button size="sm" className="bg-[#556B2F] hover:bg-[#4a5e28] text-white border-none shadow-sm rounded-full">
                    Admin Login
                  </Button>
                </Link>
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
                <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="lg" className="bg-[#556B2F] hover:bg-[#4a5e28] text-white w-full mt-2">
                    Admin Login
                  </Button>
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet context={{ openLoginModal: () => {} } satisfies PublicOutletContext} />
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
    </div>
  );
}