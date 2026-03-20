import { useState } from "react";
import { Link } from "wouter";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Orders() {
  const { isAuthenticated, loading } = useAuth();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.orders.list.useQuery({ status: status === "all" ? undefined : status, page, limit: 20 }, { enabled: isAuthenticated, retry: false });

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00B9E9] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-white mb-4">Sign in to view orders</h2>
        <Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = getLoginUrl(); }}>Sign In</Button></div>
    </div>
  );

  const orders = (data as any)?.orders ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 20);
  const statusBadge = (s: string) => ({ pending: "bg-yellow-500/10 text-yellow-400", processing: "bg-blue-500/10 text-blue-400", completed: "bg-[#22C55E]/10 text-[#22C55E]", failed: "bg-red-500/10 text-red-400", refunded: "bg-orange-500/10 text-orange-400" }[s] ?? "bg-slate-500/10 text-slate-400");

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold text-white">My Orders</h1><p className="text-slate-500 mt-1">{total} orders total</p></div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-[#0F172A] border-white/10 text-white h-9"><SelectValue/></SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="all">All Orders</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="container py-8">
        {isLoading ? <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="glass-card rounded-xl p-5 h-20 animate-pulse"/>)}</div>
        : orders.length === 0 ? (
          <div className="text-center py-20"><Package className="h-16 w-16 text-slate-700 mx-auto mb-4"/><h3 className="text-xl font-semibold text-white mb-2">No orders found</h3><Link href="/products"><Button className="mt-4 bg-[#00B9E9] hover:bg-[#00a8d4] text-white">Browse Products</Button></Link></div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link key={order.id} href={"/orders/" + order.id}>
                  <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-white/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#00B9E9]/10 flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-[#00B9E9]"/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1"><span className="font-semibold text-white">Order #{order.id}</span><Badge className={"text-xs border-0 " + statusBadge(order.status)}>{order.status}</Badge></div>
                        <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()} · {order.currency}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-white">${Number(order.totalUSD).toFixed(2)}</div>
                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-[#00B9E9] transition-colors ml-auto mt-1"/>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
                <span className="text-slate-500 text-sm px-4">Page {page} of {totalPages}</span>
                <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer/>
    </div>
  );
}
