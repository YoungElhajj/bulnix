import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Ticket,
  Settings, Activity, Tag, LogOut, Menu, X, Shield,
  DollarSign, KeyRound, ChevronRight, TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "https://static-assets.manus.space/manus-storage/bulnix-new-logo_9cb6900b.jpg";

const navItems = [
  { label: "Dashboard",        href: "/admin",                    icon: LayoutDashboard },
  { label: "Products",         href: "/admin/products",           icon: Package },
  { label: "Categories",       href: "/admin/categories",         icon: Tag },
  { label: "Orders",           href: "/admin/orders",             icon: ShoppingCart },
  { label: "Users",            href: "/admin/users",              icon: Users },
  { label: "Tickets",          href: "/admin/tickets",            icon: Ticket },
  { label: "Providers",        href: "/admin/providers",          icon: Settings },
  { label: "Supplier Refunds", href: "/admin/supplier-refunds",   icon: DollarSign },
  { label: "Payment Rates",    href: "/admin/payment-rates",     icon: TrendingUp },
  { label: "Logs",             href: "/admin/logs",               icon: Activity },
];

const accountItems = [
  { label: "Account Settings", href: "/admin/account", icon: KeyRound },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.href === "/admin"
      ? location === "/admin"
      : location.startsWith(item.href);
    return (
      <Link href={item.href}>
        <div
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
          <span className="flex-1">{item.label}</span>
          {isActive && <ChevronRight className="h-3 w-3 text-emerald-500/60" />}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-30 bg-[#0d1117] border-r border-emerald-900/30 transform transition-transform duration-200 lg:translate-x-0 flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="p-5 border-b border-emerald-900/30 flex items-center justify-between">
          <Link href="/admin">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={LOGO_URL} alt="Bulnix" className="h-7 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div>
                <span className="text-white font-bold text-sm tracking-tight">Bulnix</span>
                <div className="text-[10px] text-emerald-400 font-semibold tracking-widest uppercase">Admin</div>
              </div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-3 py-2">Management</p>
          <div className="space-y-0.5">
            {navItems.map(item => <NavLink key={item.href} item={item} />)}
          </div>
          <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest px-3 pt-4 pb-2">Account</p>
          <div className="space-y-0.5">
            {accountItems.map(item => <NavLink key={item.href} item={item} />)}
          </div>
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-emerald-900/30">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-white/3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-lg shadow-emerald-900/50">
              {(user?.name ?? user?.email ?? "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.name ?? "Admin"}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-sm shadow-emerald-500/50" title="Online" />
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <button className="w-full text-xs text-slate-500 hover:text-emerald-400 py-1.5 px-2 rounded hover:bg-emerald-500/5 transition-colors text-left">← Store</button>
            </Link>
            <button onClick={() => logout()} className="text-xs text-slate-500 hover:text-red-400 py-1.5 px-2 rounded hover:bg-red-500/5 transition-colors flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0d1117]/95 backdrop-blur-md border-b border-emerald-900/30 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="h-4 w-4 text-emerald-500/60 flex-shrink-0" />
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Admin
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
