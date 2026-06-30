import { Link } from "wouter";
import { Package, ShoppingCart, Ticket, User, CheckCircle, Clock, Wallet, Plus, ChevronRight, Trophy, Star, Users, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { getUserTier, getNextTier, getProgressToNextTier } from "@/lib/tiers";

const statusBadge = (s: string) => ({
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-600 border-red-200",
}[s] ?? "bg-[#F5F9FF] text-[#4A6080] border-[#D8E8F5]");

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: orders } = trpc.orders.list.useQuery({ limit: 5 }, { enabled: isAuthenticated, retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) });
  const { data: tickets } = trpc.tickets.list.useQuery(undefined, { enabled: isAuthenticated, retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) });
  const { data: wallet } = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated, retry: 2, retryDelay: (a) => Math.min(1000 * 2 ** a, 10000) });

  if (loading) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="text-center bg-white rounded-2xl p-10 border border-[#D8E8F5] shadow-sm max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold text-[#0D2137] mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Sign in to access your dashboard</h2>
        <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-6 w-full" onClick={() => { window.location.href = '/login'; }}>Sign In</Button>
      </div>
    </div>
  );

  const recentOrders = (orders as any)?.items ?? (orders as any)?.orders ?? [];
  const openTickets = ((tickets as any[]) ?? []).filter((t: any) => t.status !== "closed").length;
  const totalSpent = parseFloat((wallet as any)?.totalSpent ?? "0");
  const tier = getUserTier(totalSpent);
  const nextTier = getNextTier(totalSpent);
  const progress = getProgressToNextTier(totalSpent);
  const tierProgressColor = tier.name === "Bronze" ? "bg-amber-500" : tier.name === "Silver" ? "bg-slate-400" : tier.name === "Gold" ? "bg-yellow-500" : tier.name === "Platinum" ? "bg-cyan-500" : "bg-purple-500";

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <SEO title="Dashboard" description="Manage your orders, wallet, tickets and account settings on Bulnix." />
      <Navbar />
      {/* Header */}
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Dashboard</h1>
          <p className="text-white/60 mt-1">Welcome back, {user?.name ?? "User"}</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Wallet Banner */}
        <Link href="/wallet">
          <div className="bg-gradient-to-r from-[#0F3D5E] to-[#0050D0] rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between cursor-pointer hover:shadow-xl hover:shadow-[#0050D0]/20 transition-all group gap-3">
              <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs">Wallet Balance</p>
                <p className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  ${Number(wallet?.balanceUSD ?? 0).toFixed(2)} <span className="text-xs sm:text-sm text-white/50 font-normal">USD</span>
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/20 border gap-1.5 group-hover:scale-105 transition-transform rounded-full shrink-0 text-xs sm:text-sm">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Add </span>Funds
            </Button>
          </div>
        </Link>

        {/* Tier Banner */}
        <Link href="/profile">
          <div className={`rounded-2xl border-2 ${tier.borderColor} ${tier.bgColor} p-4 mb-5 cursor-pointer hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/60 border border-white/80">
                  {tier.emoji}
                </div>
                <div>
                  <div className={`font-bold text-base ${tier.color}`}>{tier.name} Member</div>
                  <div className="text-xs text-[#4A6080]">${totalSpent.toFixed(2)} total spent{nextTier ? ` · $${(nextTier.minSpend - totalSpent).toFixed(2)} to ${nextTier.emoji} ${nextTier.name}` : " · Top tier reached!"}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#4A6080]">
                <Trophy className={`w-4 h-4 ${tier.color}`} />
                <span>View tier details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
            {nextTier && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[#4A6080] mb-1">
                  <span>{tier.emoji} {tier.name}</span>
                  <span>{nextTier.emoji} {nextTier.name} at ${nextTier.minSpend}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${tierProgressColor}`} style={{width:`${progress}%`}}/>
                </div>
              </div>
            )}
          </div>
        </Link>
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package, label: "Total Orders", value: (orders as any)?.total ?? 0, color: "#0050D0", bg: "#EEF4FF", link: "/orders" },
            { icon: CheckCircle, label: "Completed", value: recentOrders.filter((o:any)=>o.status==="completed").length, color: "#059669", bg: "#ECFDF5", link: "/orders" },
            { icon: Ticket, label: "Open Tickets", value: openTickets, color: "#D97706", bg: "#FFFBEB", link: "/tickets" },
            { icon: User, label: "My Profile", value: "Edit", color: "#7C3AED", bg: "#F5F3FF", link: "/profile" },
          ].map((stat, i) => (
            <Link key={i} href={stat.link}>
              <div className="bg-white rounded-2xl p-3 sm:p-5 border border-[#D8E8F5] shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3" style={{background:stat.bg}}>
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" style={{color:stat.color}}/>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-[#0D2137]" style={{ fontFamily: "'Poppins', sans-serif" }}>{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#4A6080] mt-0.5 leading-tight">{stat.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0D2137]" style={{ fontFamily: "'Poppins', sans-serif" }}>Recent Orders</h2>
              <Link href="/orders">
                <span className="text-sm text-[#0050D0] hover:underline flex items-center gap-0.5">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center mx-auto mb-3">
                  <Package className="h-7 w-7 text-[#4A6080]"/>
                </div>
                <p className="text-[#4A6080] text-sm mb-3">No orders yet</p>
                <Link href="/products">
                  <Button size="sm" className="bg-[#0050D0] hover:bg-[#0040b0] text-white rounded-full px-4">Browse Products</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order: any) => (
                  <Link key={order.id} href={"/orders/" + order.id}>
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F5F9FF] transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-[#F0F8FF] border border-[#D8E8F5] flex items-center justify-center flex-shrink-0">
                        <Clock className="h-4 w-4 text-[#0050D0]"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#0D2137]">Order #{order.id}</div>
                        <div className="text-xs text-[#4A6080]">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#0D2137]">${Number(order.totalUSD).toFixed(2)}</div>
                        <Badge className={"text-xs " + statusBadge(order.status)}>{order.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-[#D8E8F5] shadow-sm">
            <h2 className="text-lg font-bold text-[#0D2137] mb-5" style={{ fontFamily: "'Poppins', sans-serif" }}>Quick Actions</h2>
            <div className="space-y-2">
              {[
                { icon: ShoppingCart, label: "Browse Products", href: "/products", color: "#0050D0", bg: "#EEF4FF" },
                { icon: Package, label: "My Orders", href: "/orders", color: "#0050D0", bg: "#EEF4FF" },
                { icon: Ticket, label: "Support Tickets", href: "/tickets", color: "#D97706", bg: "#FFFBEB" },
                { icon: User, label: "Profile Settings", href: "/profile", color: "#7C3AED", bg: "#F5F3FF" },
                { icon: Star, label: "Reward Points", href: "/rewards", color: "#D97706", bg: "#FFFBEB" },
                { icon: Users, label: "Affiliate Program", href: "/affiliate", color: "#059669", bg: "#ECFDF5" },
                { icon: Key, label: "API Keys", href: "/api-keys", color: "#0891B2", bg: "#ECFEFF" },
              ].map((a, i) => (
                <Link key={i} href={a.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F5F9FF] transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:a.bg}}>
                      <a.icon className="h-4 w-4" style={{color:a.color}}/>
                    </div>
                    <span className="text-sm text-[#4A6080] group-hover:text-[#0D2137] transition-colors font-medium">{a.label}</span>
                    <ChevronRight className="w-4 h-4 text-[#D8E8F5] group-hover:text-[#4A6080] ml-auto transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
