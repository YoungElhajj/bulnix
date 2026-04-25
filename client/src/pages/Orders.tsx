import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Package, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Orders() {
  const { isAuthenticated, loading } = useAuth();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Map friendly filter labels → actual DB status values
  const statusMap: Record<string, string | undefined> = {
    all: undefined,
    pending_payment: "pending_payment",
    processing: "processing",
    fulfilled: "fulfilled",
    failed: "failed",
    cancelled: "cancelled",
    refunded: "refunded",
  };

  // Handle return from payment gateway (Paystack/Flutterwave redirect back here)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentRef = params.get("payment_ref");
    const paymentStatus = params.get("status");
    if (paymentRef) {
      if (paymentStatus === "success" || paymentStatus === "successful" || paymentStatus === "completed") {
        toast.success("Payment received! Your order is being processed.", { duration: 6000 });
      } else if (paymentStatus === "cancelled" || paymentStatus === "failed" || paymentStatus === "abandoned") {
        toast.error("Payment was cancelled or failed. Please try again from your order.", { duration: 6000 });
      } else {
        toast.info("Payment submitted. Your order status will update shortly.", { duration: 6000 });
      }
      // Clean up URL without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);
  const { data, isLoading } = trpc.orders.list.useQuery({ status: statusMap[status], page, limit: 20 }, { enabled: isAuthenticated, retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });

  if (loading) return <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-[#0D2137] mb-4">Sign in to view orders</h2>
        <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white" onClick={() => { window.location.href = '/login'; }}>Sign In</Button></div>
    </div>
  );

  const orders = (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 20);
  const statusBadge = (s: string) => ({
    pending_payment: "bg-yellow-500/10 text-yellow-600",
    paid: "bg-green-500/10 text-green-600",
    processing: "bg-blue-500/10 text-blue-600",
    fulfilled: "bg-[#EEF4FF] text-[#0050D0]",
    partial: "bg-purple-500/10 text-purple-600",
    failed: "bg-red-500/10 text-red-500",
    cancelled: "bg-slate-500/10 text-slate-500",
    refunded: "bg-orange-500/10 text-orange-500",
    disputed: "bg-pink-500/10 text-pink-500",
  }[s] ?? "bg-slate-500/10 text-[#4A6080]");
  const statusLabel = (s: string) => ({
    pending_payment: "Pending",
    paid: "Paid",
    processing: "Processing",
    fulfilled: "Completed",
    partial: "Partial",
    failed: "Failed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    disputed: "Disputed",
  }[s] ?? s);

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container pb-2"><button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-white/60 hover:text-[#00C2FF] text-sm transition-colors">← Back</button></div>
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold text-white" style={{fontFamily:"'Poppins', sans-serif"}}>My Orders</h1><p className="text-white/60 mt-1">{total} orders total</p></div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-white border-[#D8E8F5] text-[#0D2137] h-9"><SelectValue/></SelectTrigger>
            <SelectContent className="bg-white border-[#D8E8F5]">
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending_payment">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="fulfilled">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="container py-8">
        {isLoading ? <div className="space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 h-20 animate-pulse"/>)}</div>
        : orders.length === 0 ? (
          <div className="text-center py-20"><Package className="h-16 w-16 text-[#4A6080] mx-auto mb-4"/><h3 className="text-xl font-semibold text-[#0D2137] mb-2">No orders found</h3><Link href="/products"><Button className="mt-4 bg-[#0050D0] hover:bg-[#0040b0] text-white">Browse Products</Button></Link></div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order: any) => (
                <Link key={order.id} href={"/orders/" + order.id}>
                  <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 cursor-pointer hover:border-[#D8E8F5] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#EEF4FF] flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-[#0050D0]"/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1"><span className="font-semibold text-[#0D2137]">Order #{order.id}</span><Badge className={"text-xs border-0 " + statusBadge(order.status)}>{statusLabel(order.status)}</Badge></div>
                        <div className="text-xs text-[#4A6080]">{new Date(order.createdAt).toLocaleString()} · {order.currency}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-[#0D2137]">${Number(order.totalUSD).toFixed(2)}</div>
                        <ChevronRight className="h-4 w-4 text-[#4A6080] group-hover:text-[#0050D0] transition-colors ml-auto mt-1"/>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF]" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
                <span className="text-[#4A6080] text-sm px-4">Page {page} of {totalPages}</span>
                <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF]" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer/>
    </div>
  );
}
