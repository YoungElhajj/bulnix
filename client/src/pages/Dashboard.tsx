import { Link } from "wouter";
import { Package, ShoppingCart, Ticket, User, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: orders } = trpc.orders.list.useQuery({ limit: 5 }, { enabled: isAuthenticated, retry: false });
  const { data: tickets } = trpc.tickets.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00B9E9] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-white mb-4">Sign in to access your dashboard</h2>
        <Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button></div>
    </div>
  );

  const recentOrders = (orders as any)?.orders ?? [];
  const openTickets = ((tickets as any[]) ?? []).filter((t: any) => t.status !== "closed").length;
  const statusColor = (s: string) => ({ pending: "text-yellow-400", processing: "text-blue-400", completed: "text-[#22C55E]", failed: "text-red-400" }[s] ?? "text-slate-400");
  const statusBadge = (s: string) => ({ pending: "bg-yellow-500/10 text-yellow-400", processing: "bg-blue-500/10 text-blue-400", completed: "bg-[#22C55E]/10 text-[#22C55E]", failed: "bg-red-500/10 text-red-400" }[s] ?? "bg-slate-500/10 text-slate-400");

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container"><h1 className="text-3xl font-bold text-white">Dashboard</h1><p className="text-slate-500 mt-1">Welcome back, {user?.name ?? "User"}</p></div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package, label: "Total Orders", value: (orders as any)?.total ?? 0, color: "#00B9E9", link: "/orders" },
            { icon: CheckCircle, label: "Completed", value: recentOrders.filter((o:any)=>o.status==="completed").length, color: "#22C55E", link: "/orders" },
            { icon: Ticket, label: "Open Tickets", value: openTickets, color: "#F59E0B", link: "/tickets" },
            { icon: User, label: "My Profile", value: "Edit", color: "#8B5CF6", link: "/profile" },
          ].map((stat, i) => (
            <Link key={i} href={stat.link}>
              <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-white/20 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{background:stat.color+"15"}}>
                  <stat.icon className="h-5 w-5" style={{color:stat.color}}/>
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Recent Orders</h2>
              <Link href="/orders"><span className="text-sm text-[#00B9E9] hover:underline">View all</span></Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-10 w-10 text-slate-700 mx-auto mb-3"/>
                <p className="text-slate-500 text-sm">No orders yet</p>
                <Link href="/products"><Button size="sm" className="mt-3 bg-[#00B9E9] hover:bg-[#00a8d4] text-white">Browse Products</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <Link key={order.id} href={"/orders/" + order.id}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <Clock className={"h-5 w-5 " + statusColor(order.status)}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">Order #{order.id}</div>
                        <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-white">${Number(order.totalUSD).toFixed(2)}</div>
                        <Badge className={"text-xs border-0 " + statusBadge(order.status)}>{order.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: ShoppingCart, label: "Browse Products", href: "/products", color: "#00B9E9" },
                { icon: Package, label: "My Orders", href: "/orders", color: "#22C55E" },
                { icon: Ticket, label: "Support Tickets", href: "/tickets", color: "#F59E0B" },
                { icon: User, label: "Profile Settings", href: "/profile", color: "#8B5CF6" },
              ].map((a, i) => (
                <Link key={i} href={a.href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:a.color+"15"}}>
                      <a.icon className="h-4 w-4" style={{color:a.color}}/>
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{a.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
