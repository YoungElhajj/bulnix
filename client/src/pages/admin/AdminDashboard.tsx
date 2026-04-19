import { Link } from "wouter";
import { Package, Users, ShoppingCart, Ticket, TrendingUp, AlertCircle, RefreshCw, Activity, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const enabled = isAuthenticated && user?.role === "admin";

  const { data: stats, isLoading, refetch } = trpc.admin.getStats.useQuery(undefined, { enabled, retry: false });
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = trpc.admin.providers.getAccsZoneBalance.useQuery(undefined, {
    enabled,
    retry: false,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
  });

  const s = stats as any;
  const bal = balanceData as any;

  const handleRefresh = () => {
    refetch();
    refetchBalance();
  };

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
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2"/> Refresh
        </Button>
      </div>

      {/* AccsZone Balance Card */}
      <div className={`mb-6 rounded-xl border p-5 flex items-center gap-4 ${
        balanceLoading
          ? "bg-white/5 border-emerald-900/30 animate-pulse"
          : bal?.lowBalance
            ? "bg-red-500/5 border-red-500/30"
            : "bg-emerald-500/5 border-emerald-500/20"
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
          bal?.lowBalance ? "bg-red-500/15" : "bg-emerald-500/15"
        }`}>
          <Wallet className={`h-6 w-6 ${bal?.lowBalance ? "text-red-400" : "text-emerald-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-300">AccsZone Supplier Balance</span>
            {!balanceLoading && (
              bal?.error
                ? <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs">Unavailable</Badge>
                : bal?.lowBalance
                  ? <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3"/>Low Balance</Badge>
                  : <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/>Healthy</Badge>
            )}
          </div>
          {balanceLoading ? (
            <div className="h-7 w-24 bg-white/10 rounded mt-1" />
          ) : bal?.error ? (
            <p className="text-sm text-slate-500 mt-0.5">{bal.error}</p>
          ) : (
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className={`text-2xl font-bold ${bal?.lowBalance ? "text-red-400" : "text-emerald-400"}`}>
                ${Number(bal?.balance ?? 0).toFixed(2)}
              </span>
              {Number(bal?.referralBalance ?? 0) > 0 && (
                <span className="text-sm text-slate-400">+ ${Number(bal.referralBalance).toFixed(2)} referral</span>
              )}
            </div>
          )}
          {!balanceLoading && bal?.lowBalance && !bal?.error && (
            <p className="text-xs text-red-400/80 mt-1">
              Balance is below $5.00. Top up your AccsZone account to prevent order fulfillment failures. You have been notified by email.
            </p>
          )}
        </div>
        <a
          href="https://accszone.com/balance"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
        >
          Top Up
        </a>
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
              { icon: Users,        label: "Total Users",      value: s?.totalUsers ?? 0,                            color: "#34d399", link: "/admin/users" },
              { icon: Package,      label: "Products",         value: s?.totalProducts ?? 0,                         color: "#34d399", link: "/admin/products" },
              { icon: ShoppingCart, label: "Total Orders",     value: s?.totalOrders ?? 0,                           color: "#a78bfa", link: "/admin/orders" },
              { icon: TrendingUp,   label: "Revenue (USD)",    value: "$" + Number(s?.totalRevenue ?? 0).toFixed(0), color: "#fbbf24", link: "/admin/orders" },
              { icon: AlertCircle,  label: "Failed Orders",    value: s?.failedOrders ?? 0,                          color: "#f87171", link: "/admin/orders" },
              { icon: Ticket,       label: "Open Tickets",     value: s?.openTickets ?? 0,                           color: "#fbbf24", link: "/admin/tickets" },
              { icon: Activity,     label: "Pending Orders",   value: s?.pendingOrders ?? 0,                         color: "#34d399", link: "/admin/orders" },
              { icon: Package,      label: "Visible Products", value: s?.visibleProducts ?? 0,                       color: "#34d399", link: "/admin/products" },
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">AccsZone Connector</span>
                  <Badge className={
                    balanceLoading ? "bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs" :
                    bal?.error ? "bg-red-500/10 text-red-400 border border-red-500/20 text-xs" :
                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs"
                  }>
                    {balanceLoading ? "checking..." : bal?.error ? "error" : "active"}
                  </Badge>
                </div>
                {[
                  { label: "Payment Gateway",  status: "active" },
                  { label: "Database",         status: "active" },
                  { label: "Webhook Handler",  status: "active" },
                  { label: "Auto-Sync",        status: "active" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{item.label}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
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
