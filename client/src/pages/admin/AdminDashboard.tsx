import { Link } from "wouter";
import { Package, Users, ShoppingCart, Ticket, TrendingUp, AlertCircle, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats, isLoading, refetch } = trpc.admin.getStats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const s = stats as any;

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time platform metrics</p>
        </div>
        <Button
          variant="outline"
          className="border-emerald-900/40 text-slate-400 hover:text-white hover:bg-white/5 bg-transparent h-9"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2"/> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_,i) => (
            <div key={i} className="bg-white/5 border border-emerald-900/30 rounded-xl p-5 h-24 animate-pulse"/>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users,        label: "Total Users",      value: s?.totalUsers ?? 0,                          color: "#34d399", link: "/admin/users" },
              { icon: Package,      label: "Products",         value: s?.totalProducts ?? 0,                       color: "#34d399", link: "/admin/products" },
              { icon: ShoppingCart, label: "Total Orders",     value: s?.totalOrders ?? 0,                         color: "#a78bfa", link: "/admin/orders" },
              { icon: TrendingUp,   label: "Revenue (USD)",    value: "$" + Number(s?.totalRevenue ?? 0).toFixed(0), color: "#fbbf24", link: "/admin/orders" },
              { icon: AlertCircle,  label: "Failed Orders",    value: s?.failedOrders ?? 0,                        color: "#f87171", link: "/admin/orders" },
              { icon: Ticket,       label: "Open Tickets",     value: s?.openTickets ?? 0,                         color: "#fbbf24", link: "/admin/tickets" },
              { icon: Activity,     label: "Pending Orders",   value: s?.pendingOrders ?? 0,                       color: "#34d399", link: "/admin/orders" },
              { icon: Package,      label: "Visible Products", value: s?.visibleProducts ?? 0,                     color: "#34d399", link: "/admin/products" },
            ].map((stat, i) => (
              <Link key={i} href={stat.link}>
                <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-5 cursor-pointer hover:border-emerald-500/30 hover:bg-white/5 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background: stat.color + "18"}}>
                      <stat.icon className="h-4 w-4" style={{color: stat.color}}/>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sync Products",    href: "/admin/providers",  color: "#34d399" },
                  { label: "Manage Products",  href: "/admin/products",   color: "#34d399" },
                  { label: "View Orders",      href: "/admin/orders",     color: "#a78bfa" },
                  { label: "Reply Tickets",    href: "/admin/tickets",    color: "#fbbf24" },
                ].map((a, i) => (
                  <Link key={i} href={a.href}>
                    <div
                      className="p-3 rounded-lg border border-emerald-900/30 hover:border-emerald-500/30 hover:bg-white/5 cursor-pointer transition-all text-sm font-medium text-center"
                      style={{color: a.color}}
                    >
                      {a.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4">System Status</h3>
              <div className="space-y-3">
                {[
                  { label: "AccsZone Connector", status: "active" },
                  { label: "Payment Gateway",    status: "pending" },
                  { label: "Database",           status: "active" },
                  { label: "Webhook Handler",    status: "active" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <Badge className={
                      item.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs"
                    }>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
