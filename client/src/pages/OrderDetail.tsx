import { Link, useParams } from "wouter";
import { Package, CheckCircle, Clock, ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function OrderDetail() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const orderId = parseInt(params.id ?? "0");
  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id: orderId }, { enabled: isAuthenticated && !!orderId, retry: false });
  const { data: delivery } = trpc.orders.getDelivery.useQuery({ orderId }, { enabled: isAuthenticated && !!orderId, retry: false });
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  if (isLoading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00B9E9] border-t-transparent rounded-full animate-spin"/></div>;
  if (!order) return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">
      <div className="text-center"><Package className="h-12 w-12 text-slate-700 mx-auto mb-4"/><h2 className="text-xl font-bold mb-2">Order not found</h2><Link href="/orders"><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white mt-3">Back to Orders</Button></Link></div>
    </div>
  );

  const o = order as any;
  const deliveries = (delivery as any[]) ?? [];
  const statusBadge = { pending: "bg-yellow-500/10 text-yellow-400", processing: "bg-blue-500/10 text-blue-400", completed: "bg-[#22C55E]/10 text-[#22C55E]", failed: "bg-red-500/10 text-red-400" }[o.status as string] ?? "bg-slate-500/10 text-slate-400";

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container">
          <Link href="/orders"><button className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-4 transition-colors"><ArrowLeft className="h-4 w-4"/> Back to Orders</button></Link>
          <div className="flex items-center gap-4 flex-wrap"><h1 className="text-3xl font-bold text-white">Order #{o.id}</h1><Badge className={"border-0 " + statusBadge}>{o.status}</Badge></div>
          <p className="text-slate-500 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
        </div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Order Items</h2>
              <div className="space-y-3">
                {(o.items ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/3 rounded-lg">
                    <Package className="h-8 w-8 text-slate-600 flex-shrink-0"/>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-white">{item.productTitle ?? "Product #" + item.productId}</div><div className="text-xs text-slate-500">Qty: {item.quantity}</div></div>
                    <div className="text-sm font-semibold text-white">${Number(item.unitPriceUSD * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            {deliveries.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-[#22C55E]"/> Delivery Details</h2>
                <div className="space-y-3">
                  {deliveries.map((d: any, i: number) => (
                    <div key={i} className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0"><div className="text-xs text-slate-500 mb-1">Account #{i + 1}</div><div className="font-mono text-sm text-white break-all">{d.deliveryData}</div></div>
                        <button onClick={() => copyToClipboard(d.deliveryData)} className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><Copy className="h-4 w-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {o.status === "pending" && (
              <div className="glass-card rounded-xl p-5 border-l-4 border-yellow-500">
                <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-yellow-400"/><div><div className="font-semibold text-white text-sm">Awaiting Payment</div><div className="text-xs text-slate-500">Complete payment to receive your order</div></div></div>
              </div>
            )}
          </div>
          <div className="glass-card rounded-xl p-6 h-fit">
            <h2 className="text-lg font-bold text-white mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Order ID</span><span className="text-white font-mono">#{o.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status</span><Badge className={"text-xs border-0 " + statusBadge}>{o.status}</Badge></div>
              <div className="flex justify-between"><span className="text-slate-400">Currency</span><span className="text-white">{o.currency}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Payment</span><span className="text-white capitalize">{o.paymentGateway ?? "—"}</span></div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold"><span className="text-white">Total</span><span className="text-[#22C55E]">${Number(o.totalUSD).toFixed(2)}</span></div>
            </div>
            <Link href="/tickets"><Button variant="outline" className="w-full mt-5 border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-sm">Need Help? Open Ticket</Button></Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
