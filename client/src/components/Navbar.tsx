import { useState, useEffect } from "react";
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

const LOGO_URL = "/manus-storage/bulnix-primary-logo_0bd2bde3.jpeg";

const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "FAQ", href: "/faq" },
  { label: "Support", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; }
  });

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navBg = isDark
    ? scrolled ? "bg-[#061A2B]/95 shadow-lg shadow-black/30" : "bg-[#061A2B]/80"
    : scrolled ? "bg-white/95 shadow-md shadow-slate-200/60" : "bg-white/80";

  const borderColor = isDark ? "border-[#0F3D5E]/50" : "border-slate-200/80";
  const linkBase = isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-[#0F3D5E]";
  const linkActive = "text-[#00C2FF]";
  const iconBtn = isDark
    ? "text-slate-400 hover:text-white hover:bg-[#0F3D5E]/60"
    : "text-slate-500 hover:text-[#0F3D5E] hover:bg-slate-100";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b ${borderColor} ${navBg} backdrop-blur-md transition-all duration-300`}>
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo — no box, just the image */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src={LOGO_URL}
              alt="Bulnix"
              className="h-9 w-auto object-contain"
              style={{ background: "transparent" }}
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href) ? linkActive : linkBase
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={iconBtn}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className={`relative ${iconBtn}`}>
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#00C2FF] text-[#061A2B] border-0 font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Auth */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`hidden md:flex items-center gap-2 px-3 ${isDark ? "text-slate-300 hover:text-white hover:bg-[#0F3D5E]/60" : "text-slate-700 hover:text-[#0F3D5E] hover:bg-slate-100"}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#00C2FF]/20 border border-[#00C2FF]/40 flex items-center justify-center text-xs font-semibold text-[#00C2FF]">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-24 truncate">{user.name || user.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={`w-52 ${isDark ? "bg-[#0A2540] border-[#0F3D5E]" : "bg-white border-slate-200"}`}>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-[#00C2FF]" />
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
                      <Wallet className="h-4 w-4 text-[#00C2FF]" />
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
                      <DropdownMenuSeparator className={isDark ? "bg-[#0F3D5E]" : "bg-slate-200"} />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4 text-[#00C2FF]" />
                          <span className="text-[#00C2FF]">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className={isDark ? "bg-[#0F3D5E]" : "bg-slate-200"} />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isDark ? "text-slate-300 hover:text-white hover:bg-[#0F3D5E]/60" : "text-slate-700 hover:text-[#0F3D5E] hover:bg-slate-100 font-medium"}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-[#0319CB] hover:bg-[#0226a8] text-white font-bold rounded-full px-5 shadow-md shadow-[#0319CB]/30 transition-all duration-200 hover:shadow-lg hover:shadow-[#0319CB]/40"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden ${iconBtn}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className={`md:hidden border-t ${borderColor} py-4 space-y-1 ${isDark ? "bg-[#061A2B]" : "bg-white"}`}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "text-[#00C2FF] bg-[#00C2FF]/10"
                    : isDark ? "text-slate-400 hover:text-white hover:bg-[#0F3D5E]/60" : "text-slate-600 hover:text-[#0F3D5E] hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className={`pt-3 px-4 flex flex-col gap-2 border-t ${borderColor} mt-3`}>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:bg-red-50"
                    onClick={() => { logoutMutation.mutate(); setMobileOpen(false); }}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-[#0319CB] hover:bg-[#0226a8] text-white font-bold">Sign Up</Button>
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
