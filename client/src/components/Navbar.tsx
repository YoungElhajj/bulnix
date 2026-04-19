import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart, Menu, X, ChevronDown, User, LogOut,
  LayoutDashboard, Package, Settings, Shield, Wallet, Sun, Moon,
  HelpCircle, Info, FileText, Phone, Home
} from "lucide-react";
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

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

// Primary nav links (always visible on desktop)
const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
];

// Secondary links shown in "More" dropdown and mobile menu
const moreLinks = [
  { label: "FAQ", href: "/faq", icon: HelpCircle },
  { label: "About Us", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: Phone },
  { label: "Terms of Service", href: "/terms", icon: FileText },
  { label: "Privacy Policy", href: "/privacy", icon: FileText },
  { label: "Refund Policy", href: "/refund", icon: FileText },
];

// Social media links
const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/bulnix",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@bulnix",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "https://t.me/bulnix",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/447916699429",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; }
  });
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const isActive = (href: string) => href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMobileMoreOpen(false);
  }, [location]);

  const navBg = scrolled
    ? "bg-[#0F3D5E] shadow-lg shadow-[#0F3D5E]/40"
    : "bg-[#0F3D5E]";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-[#1a5070]/50 ${navBg} backdrop-blur-md transition-all duration-300`}>
      <div className="container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src={LOGO_URL}
              alt="Bulnix"
              className="h-10 w-auto object-contain rounded-lg"
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {primaryLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-[#00C2FF] bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
                  More <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-[#0F3D5E] border-[#1a5070] shadow-xl mt-1">
                {moreLinks.map(link => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex items-center gap-2 cursor-pointer text-white/80 hover:text-white focus:text-white focus:bg-white/10">
                      <link.icon className="h-4 w-4 text-[#00C2FF]" />
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">

            {/* Social Icons — desktop only */}
            <div className="hidden xl:flex items-center gap-0.5 mr-1">
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-[#00C2FF] hover:bg-white/10 transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-white hover:bg-white/10 h-8 w-8">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-[#00C2FF] text-[#0F3D5E] border-0 font-bold">
                    {totalItems > 99 ? "99+" : totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Auth — desktop */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2 px-2.5 text-white/80 hover:text-white hover:bg-white/10 h-8"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#00C2FF]/25 border border-[#00C2FF]/50 flex items-center justify-center text-xs font-semibold text-[#00C2FF]">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-20 truncate hidden lg:block">{user.name || user.email}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white border-slate-200 shadow-xl">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <LayoutDashboard className="h-4 w-4 text-[#00C2FF]" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <Wallet className="h-4 w-4 text-[#00C2FF]" />
                      <span>My Wallet</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <Settings className="h-4 w-4 text-slate-400" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator className="bg-slate-200" />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <Shield className="h-4 w-4 text-[#00C2FF]" />
                          <span className="text-[#00C2FF]">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-slate-200" />
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
              <div className="hidden md:flex items-center gap-1.5">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 font-medium border border-white/30 hover:border-white/50 rounded-full px-4 h-8 text-xs"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="bg-[#00C2FF] hover:bg-[#00aee6] text-[#0F3D5E] font-bold rounded-full px-4 h-8 text-xs shadow-md shadow-[#00C2FF]/30 transition-all duration-200"
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
              className="lg:hidden text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#1a5070]/50 py-3 bg-[#0F3D5E]">
            {/* Primary links */}
            <div className="space-y-0.5 mb-2">
              {primaryLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-colors ${
                    isActive(link.href)
                      ? "text-[#00C2FF] bg-white/10"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* More section toggle */}
            <button
              onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg mx-2 transition-colors"
              style={{ width: "calc(100% - 1rem)" }}
            >
              <span>More Pages</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileMoreOpen ? "rotate-180" : ""}`} />
            </button>

            {mobileMoreOpen && (
              <div className="space-y-0.5 mb-2 pl-4">
                {moreLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg mx-2 transition-colors"
                  >
                    <link.icon className="h-3.5 w-3.5 text-[#00C2FF]" />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Social Icons */}
            <div className="px-4 py-2 flex items-center gap-2 border-t border-[#1a5070]/50 mt-2 pt-3">
              <span className="text-white/40 text-xs mr-1">Follow:</span>
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-[#00C2FF] hover:bg-white/10 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="px-4 pt-2 pb-2 flex flex-col gap-2 border-t border-[#1a5070]/50 mt-2">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-white/30 text-white bg-transparent hover:bg-white/10">
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Link href="/orders" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full border-white/30 text-white bg-transparent hover:bg-white/10">
                      <Package className="h-4 w-4 mr-2" /> My Orders
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
                    <Button variant="outline" size="sm" className="w-full border-white/30 text-white bg-transparent hover:bg-white/10">Sign In</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full bg-[#00C2FF] hover:bg-[#00aee6] text-[#0F3D5E] font-bold">Create Account</Button>
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
