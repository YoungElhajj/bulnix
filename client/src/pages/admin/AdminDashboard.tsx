import { Link } from "wouter";
import { Package, Users, ShoppingCart, Ticket, TrendingUp, AlertCircle, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
          <p className="text-slate-500 text-sm mt-0.5">Real-time platform metrics</p>
        </div>
        <Button variant="outline" className="border-[#0F3D5E] text-slate-400 hover:text-white hover:bg-[#0F3D5E]/30 h-9" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2"/> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{[...Array(8)].map((_,i)=><div key={i} className="glass-card rounded-xl p-5 h-24 animate-pulse"/>)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Users, label: "Total Users", value: s?.totalUsers ?? 0, color: "#00C2FF", link: "/admin/users" },
              { icon: Package, label: "Products", value: s?.totalProducts ?? 0, color: "#00C2FF", link: "/admin/products" },
              { icon: ShoppingCart, label: "Total Orders", value: s?.totalOrders ?? 0, color: "#8B5CF6", link: "/admin/orders" },
              { icon: TrendingUp, label: "Revenue (USD)", value: "$" + Number(s?.totalRevenue ?? 0).toFixed(0), color: "#F59E0B", link: "/admin/orders" },
              { icon: AlertCircle, label: "Failed Orders", value: s?.failedOrders ?? 0, color: "#EF4444", link: "/admin/orders" },
              { icon: Ticket, label: "Open Tickets", value: s?.openTickets ?? 0, color: "#F59E0B", link: "/admin/tickets" },
              { icon: Activity, label: "Pending Orders", value: s?.pendingOrders ?? 0, color: "#00C2FF", link: "/admin/orders" },
              { icon: Package, label: "Visible Products", value: s?.visibleProducts ?? 0, color: "#00C2FF", link: "/admin/products" },
            ].map((stat, i) => (
              <Link key={i} href={stat.link}>
                <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:stat.color+"15"}}>
                      <stat.icon className="h-4 w-4" style={{color:stat.color}}/>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sync Products", href: "/admin/providers", color: "#00C2FF" },
                  { label: "Manage Products", href: "/admin/products", color: "#00C2FF" },
                  { label: "View Orders", href: "/admin/orders", color: "#8B5CF6" },
                  { label: "Reply Tickets", href: "/admin/tickets", color: "#F59E0B" },
                ].map((a, i) => (
                  <Link key={i} href={a.href}>
                    <div className="p-3 rounded-lg border border-[#0F3D5E] hover:border-white/20 cursor-pointer transition-all text-sm font-medium text-center" style={{color:a.color}}>{a.label}</div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-base font-bold text-white mb-4">System Status</h3>
              <div className="space-y-3">
                {[
                  { label: "AccsZone Connector", status: "active" },
                  { label: "Payment Gateway", status: "pending" },
                  { label: "Database", status: "active" },
                  { label: "Webhook Handler", status: "active" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <Badge className={item.status === "active" ? "bg-[#00C2FF]/10 text-[#00C2FF] border-0 text-xs" : "bg-yellow-500/10 text-yellow-400 border-0 text-xs"}>{item.status}</Badge>
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
