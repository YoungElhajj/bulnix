import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart, Menu, X, ChevronDown, User, LogOut,
  LayoutDashboard, Package, Settings, Shield, Wallet, Sun, Moon,
  HelpCircle, Info, FileText, Phone, Home, Star, Gift, Key
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
import { useCurrency, CURRENCIES } from "@/contexts/CurrencyContext";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663404004095/UEAuHoiEheGEUEnr.jpg";

// Primary nav links (always visible on desktop)
const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
];
// Quick-access category shortcuts shown in a scrollable bar below the navbar
const quickCategories = [
  { label: "🎬 Streaming", href: "/categories/streaming" },
  { label: "📺 Netflix", href: "/categories/buy-netflix-accounts" },
  { label: "🎵 Spotify", href: "/categories/spotify-premium-subscription" },
  { label: "📘 Facebook", href: "/categories/buy-facebook-accounts" },
  { label: "📸 Instagram", href: "/categories/buy-instagram-accounts" },
  { label: "🎵 TikTok", href: "/categories/buy-tiktok-accounts" },
  { label: "💼 LinkedIn", href: "/categories/buy-linkedin-accounts" },
  { label: "🎮 Gaming", href: "/categories/buy-steam-gift-cards" },
  { label: "🔒 VPN", href: "/categories/buy-vpn-accounts" },
  { label: "🔑 Google Voice", href: "/categories/buy-google-voice-accounts" },
  { label: "📋 Craigslist", href: "/categories/buy-craigslist-accounts" },
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

// Social icons — Instagram, X, TikTok only
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
    <defs>
      <linearGradient id="ig-grad-nav" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#FCAF45"/>
        <stop offset="50%" stopColor="#F77737"/>
        <stop offset="75%" stopColor="#F56040"/>
        <stop offset="100%" stopColor="#C13584"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" fill="url(#ig-grad-nav)"/>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="white" strokeWidth="1.8"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
  </svg>
);

// Social media links — Instagram, X, TikTok only
const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/bulnix_", icon: <InstagramIcon />, hoverClass: "" },
  { name: "Twitter / X", href: "https://x.com/Bulnix_", icon: <TwitterXIcon />, hoverClass: "hover:text-white" },
  { name: "TikTok", href: "https://www.tiktok.com/@bulnix_", icon: <TikTokIcon />, hoverClass: "hover:text-white" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHeight, setNavHeight] = useState(90);
  const navRef = useRef<HTMLElement>(null);
  // Banner is always visible — no dismiss
  const [location] = useLocation();
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const walletQuery = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 60000 });
  const walletBalance = Number(walletQuery.data?.balanceUSD ?? 0);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; }
  });
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const useCurrencyHook = useCurrency();
  const isActive = (href: string) => href === "/" ? location === "/" : location === href || location.startsWith(href + "/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Measure nav height so mobile menu starts exactly below it
  useEffect(() => {
    const measure = () => {
      if (navRef.current) setNavHeight(navRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
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
    <nav ref={navRef} className={`fixed top-0 left-0 right-0 z-[100] border-b border-[#1a5070]/50 ${navBg} backdrop-blur-md transition-all duration-300`}>
      {/* Affiliate Banner — always visible, no dismiss, single line */}
      {!isActive("/affiliate") && (
        <div className="bg-gradient-to-r from-cyan-600 to-blue-700 border-b border-cyan-500/30 overflow-hidden">
          <div className="flex items-center justify-center py-1 px-3 gap-1.5 min-h-0">
            <Gift className="w-3 h-3 text-white flex-shrink-0" />
            <Link href="/affiliate" className="text-white text-[11px] font-medium underline underline-offset-2 hover:text-cyan-100 transition-colors whitespace-nowrap">
              <span className="hidden sm:inline">🎉 Earn up to $500 — Join Affiliate Program</span>
              <span className="sm:hidden">🎉 Earn $500 — Join Affiliate</span>
            </Link>
          </div>
        </div>
      )}

      <div className="container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src={LOGO_URL}
              alt="Bulnix"
              className="h-11 w-auto object-contain rounded-xl"
              style={{ maxWidth: 160 }}
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
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  More <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {moreLinks.map(link => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex items-center gap-2 cursor-pointer">
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side: social icons + theme + cart + auth */}
          <div className="flex items-center gap-2">

            {/* Social icons (desktop only) */}
            <div className="hidden lg:flex items-center gap-1">
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 transition-all ${s.hoverClass}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Currency Selector */}
            <select
              value={useCurrencyHook.currency}
              onChange={e => useCurrencyHook.setCurrency(e.target.value)}
              className="hidden md:block bg-white/10 border border-white/20 text-white text-xs rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/15 transition-all focus:outline-none"
              title="Select currency"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code} className="bg-[#0F3D5E] text-white">{c.code}</option>
              ))}
            </select>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-[10px] bg-[#00C2FF] text-[#0F3D5E] border-0">
                  {totalItems > 9 ? "9+" : totalItems}
                </Badge>
              )}
            </Link>

            {/* Wallet balance (authenticated) */}
            {isAuthenticated && (
              <Link href="/wallet"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all text-white text-xs font-semibold border border-white/10">
                <Wallet className="w-3.5 h-3.5 text-[#00C2FF]" />
                <span className="hidden sm:inline">${walletBalance.toFixed(2)}</span>
                <span className="sm:hidden">${walletBalance.toFixed(0)}</span>
              </Link>
            )}

            {/* Auth */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all text-white text-xs font-medium border border-white/10 max-w-[120px]">
                    <User className="w-3.5 h-3.5 text-[#00C2FF] flex-shrink-0" />
                    <span className="truncate">{user?.name?.split(" ")[0] ?? "Account"}</span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0 text-white/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2 cursor-pointer">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="w-4 h-4" /> My Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" /> Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/rewards" className="flex items-center gap-2 cursor-pointer">
                      <Star className="w-4 h-4 text-yellow-400" /> Reward Points
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/affiliate" className="flex items-center gap-2 cursor-pointer">
                      <Gift className="w-4 h-4 text-cyan-400" /> Affiliate
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/api-keys" className="flex items-center gap-2 cursor-pointer">
                      <Key className="w-4 h-4 text-slate-400" /> API Keys
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-amber-600">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 text-xs h-8 px-3">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0F3D5E] font-semibold text-xs h-8 px-3">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setMobileOpen(prev => !prev)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick-category bar (desktop) */}
      <div className="hidden lg:block border-t border-white/10 bg-[#0a2d45]">
        <div className="container">
          <div className="flex items-center gap-0.5 py-1 overflow-x-auto scrollbar-none">
            {quickCategories.map((cat, i) => (
              <Link
                key={i}
                href={cat.href}
                className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu — absolute from bottom of nav, fills rest of viewport */}
      {mobileOpen && (
        <div className="bg-[#0F3D5E] overflow-y-auto" style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: `calc(100vh - ${navHeight}px)`, zIndex: 98 }}>
          <div className="container py-4 space-y-1">
            {/* Quick category shortcuts (mobile) */}
            <div className="pb-1">
              <p className="px-3 py-1 text-xs text-white/40 uppercase tracking-wider font-semibold">Quick Categories</p>
              <div className="grid grid-cols-2 gap-1">
                {quickCategories.map((cat, i) => (
                  <Link
                    key={i}
                    href={cat.href}
                    className="flex items-center px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-white/10 my-1" />
            {/* Primary links */}
            {primaryLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href) ? "text-[#00C2FF] bg-white/10" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                <Home className="w-4 h-4" />
                {link.label}
              </Link>
            ))}

            {/* More links toggle */}
            <button
              onClick={() => setMobileMoreOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>More Pages</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileMoreOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileMoreOpen && (
              <div className="pl-4 space-y-1">
                {moreLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Currency + Theme row (mobile) */}
            <div className="flex items-center gap-2 px-3 pt-1 pb-1">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-white/50 text-xs">Currency:</span>
                <select
                  value={useCurrencyHook.currency}
                  onChange={e => useCurrencyHook.setCurrency(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 text-white text-sm rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/15 transition-all focus:outline-none"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-[#0F3D5E] text-white">{c.code} — {c.symbol}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                title={isDark ? "Light mode" : "Dark mode"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Social icons row (mobile) */}
            <div className="flex items-center gap-2 px-3 pt-1">
              {socialLinks.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/10 transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Wallet link (mobile, authenticated) */}
            {isAuthenticated && (
              <Link href="/wallet" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
                <Wallet className="w-4 h-4 text-[#00C2FF]" />
                <span>My Wallet</span>
                <span className="ml-auto text-[#00C2FF] font-bold">${walletBalance.toFixed(2)}</span>
              </Link>
            )}

            {/* User account links (mobile, authenticated) */}
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="w-4 h-4 text-white/60" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/orders" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
                  <Package className="w-4 h-4 text-white/60" />
                  <span>My Orders</span>
                </Link>
                <Link href="/rewards" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>Reward Points</span>
                </Link>
                <Link href="/affiliate" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
                  <Gift className="w-4 h-4 text-cyan-400" />
                  <span>Affiliate Program</span>
                </Link>
                <Link href="/api-keys" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(false)}>
                  <Key className="w-4 h-4 text-slate-400" />
                  <span>API Keys</span>
                </Link>
              </>
            )}

            {/* Auth buttons (mobile) */}
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 text-sm">Sign In</Button>
                </Link>
                <Link href="/signup" className="flex-1">
                  <Button className="w-full bg-[#00C2FF] hover:bg-[#00a8e0] text-[#0F3D5E] font-semibold text-sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
