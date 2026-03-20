import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, Settings, Activity, Tag, LogOut, Menu, X, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://cdn-us2.manus.computer/uploads/webdev/bulnix/ChatGPTImageMar20,2026,04_01_00AM.png";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket },
  { label: "Providers", href: "/admin/providers", icon: Settings },
  { label: "Logs", href: "/admin/logs", icon: Activity },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00B9E9] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-slate-500 mb-6">Please sign in with an admin account.</p>
          <Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6">You do not have admin privileges.</p>
          <Link href="/"><Button variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#0F172A] border-r border-white/5 z-30 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <Link href="/admin">
            <div className="flex items-center gap-2.5">
              <img src={LOGO_URL} alt="Bulnix" className="h-7 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div>
                <span className="text-white font-bold text-sm">Bulnix</span>
                <div className="text-[10px] text-[#00B9E9] font-medium tracking-wide">ADMIN PANEL</div>
              </div>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map(item => {
              const isActive = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive ? "bg-[#00B9E9]/10 text-[#00B9E9]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B9E9] to-[#22C55E] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {(user?.name ?? user?.email ?? "A")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.name ?? "Admin"}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <button className="w-full text-xs text-slate-500 hover:text-white py-1.5 px-2 rounded hover:bg-white/5 transition-colors text-left">← Store</button>
            </Link>
            <button onClick={() => logout()} className="text-xs text-slate-500 hover:text-red-400 py-1.5 px-2 rounded hover:bg-red-500/5 transition-colors flex items-center gap-1">
              <LogOut className="h-3 w-3" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0B0F19]/90 backdrop-blur-md border-b border-white/5 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
