import { Link, Outlet } from "react-router";
import { Sprout, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-[#8acb88]" />
              <span className="font-bold text-xl">AniAlerto</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm hover:text-[#8acb88] transition-colors">
                Home
              </Link>
              <Link to="/login">
                <Button size="sm" className="bg-[#8acb88] hover:bg-[#648381]">
                  Admin Login
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm hover:text-[#8acb88] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="bg-[#8acb88] hover:bg-[#648381] w-full">
                  Admin Login
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#575761] text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="h-6 w-6 text-[#8acb88]" />
                <span className="font-bold text-lg">AniAlerto</span>
              </div>
              <p className="text-sm text-gray-400">
                SMS-based advisory system for corn farm management
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <p className="text-sm text-gray-400">Email: info@anialerto.com</p>
              <p className="text-sm text-gray-400">Phone: +63 123 456 7890</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
                <Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  About AniAlerto
                </Link>
                <Link to="/corn-guide" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Corn Farming Guide
                </Link>
                <Link to="/farm-tour" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Get to Know the Farm
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 AniAlerto. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
