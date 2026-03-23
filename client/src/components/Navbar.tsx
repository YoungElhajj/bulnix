import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Package, Settings, Shield, Wallet, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404004095/6qKkSV9dybS3AerhXhrTfQ/bulnix-logo_f53aba21.png";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "FAQ", href: "/faq" },
  { label: "Support", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; }
  });

  const { theme, toggleTheme } = useTheme();
  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: "rgba(11,15,25,0.95)", backdropFilter: "blur(12px)" }}>
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src={LOGO_URL} alt="Bulnix" className="h-8 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-[#00B9E9]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-slate-400 hover:text-white hover:bg-white/5"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#00B9E9] text-white border-0">
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/5 px-3">
                    <div className="w-7 h-7 rounded-full bg-[#00B9E9]/20 border border-[#00B9E9]/30 flex items-center justify-center text-xs font-semibold text-[#00B9E9]">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-24 truncate">{user.name || user.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#0F172A] border-white/10">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-[#00B9E9]" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4 text-[#22C55E]" />
                      <span>My Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4 text-slate-400" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4 text-[#22C55E]" />
                          <span className="text-[#22C55E]">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white font-semibold">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "text-[#00B9E9] bg-[#00B9E9]/10"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 px-4 flex flex-col gap-2 border-t border-white/5 mt-3">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-white/10 text-slate-300">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-400 hover:bg-red-500/10"
                    onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-white/10 text-slate-300">Sign In</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-[#00B9E9] hover:bg-[#00a8d4] text-white">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
