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
  const { data: order, isLoading } = trpc.orders.getById.useQuery({ id: orderId }, { enabled: isAuthenticated && !!orderId, retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });
  const { data: delivery } = trpc.orders.getDelivery.useQuery({ orderId }, { enabled: isAuthenticated && !!orderId, retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  if (isLoading) return <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin"/></div>;
  if (!order) return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137] flex items-center justify-center">
      <div className="text-center"><Package className="h-12 w-12 text-[#4A6080] mx-auto mb-4"/><h2 className="text-xl font-bold mb-2">Order not found</h2><Link href="/orders"><Button className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] mt-3">Back to Orders</Button></Link></div>
    </div>
  );

  const o = order as any;
  const deliveries = (delivery as any[]) ?? [];
  const statusBadge = { pending: "bg-yellow-500/10 text-yellow-400", processing: "bg-blue-500/10 text-blue-400", completed: "bg-[#EEF4FF] text-[#0050D0]", failed: "bg-red-500/10 text-red-400" }[o.status as string] ?? "bg-slate-500/10 text-[#4A6080]";

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <Link href="/orders"><button className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"><ArrowLeft className="h-4 w-4"/> Back to Orders</button></Link>
          <div className="flex items-center gap-4 flex-wrap"><h1 className="text-3xl font-bold text-white">Order #{o.id}</h1><Badge className={"border-0 " + statusBadge}>{o.status}</Badge></div>
          <p className="text-white/60 mt-1">{new Date(o.createdAt).toLocaleString()}</p>
        </div>
      </div>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6">
              <h2 className="text-lg font-bold text-[#0D2137] mb-4">Order Items</h2>
              <div className="space-y-3">
                {(o.items ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/3 rounded-lg">
                    <Package className="h-8 w-8 text-[#4A6080] flex-shrink-0"/>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-[#0D2137]">{item.productTitle ?? "Product #" + item.productId}</div><div className="text-xs text-[#4A6080]">Qty: {item.quantity}</div></div>
                    <div className="text-sm font-semibold text-[#0D2137]">${Number(item.unitPriceUSD * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            {deliveries.length > 0 && (
              <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6">
                <h2 className="text-lg font-bold text-[#0D2137] mb-4 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-[#0050D0]"/> Delivery Details</h2>
                <div className="space-y-3">
                  {deliveries.map((d: any, i: number) => (
                    <div key={i} className="p-4 bg-[#F0F8FF] border border-[#0050D0]/20 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0"><div className="text-xs text-[#4A6080] mb-1">Account #{i + 1}</div><div className="font-mono text-sm text-[#0D2137] break-all">{d.deliveryData}</div></div>
                        <button onClick={() => copyToClipboard(d.deliveryData)} className="flex-shrink-0 p-2 rounded-lg hover:bg-[#F0F8FF] text-[#4A6080] hover:text-[#0D2137] transition-colors"><Copy className="h-4 w-4"/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {o.status === "pending" && (
              <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 border-l-4 border-yellow-500">
                <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-yellow-400"/><div><div className="font-semibold text-[#0D2137] text-sm">Awaiting Payment</div><div className="text-xs text-[#4A6080]">Complete payment to receive your order</div></div></div>
              </div>
            )}
          </div>
          <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 h-fit">
            <h2 className="text-lg font-bold text-[#0D2137] mb-4">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#4A6080]">Order ID</span><span className="text-[#0D2137] font-mono">#{o.id}</span></div>
              <div className="flex justify-between"><span className="text-[#4A6080]">Status</span><Badge className={"text-xs border-0 " + statusBadge}>{o.status}</Badge></div>
              <div className="flex justify-between"><span className="text-[#4A6080]">Currency</span><span className="text-[#0D2137]">{o.currency}</span></div>
              <div className="flex justify-between"><span className="text-[#4A6080]">Payment</span><span className="text-[#0D2137] capitalize">{o.paymentGateway ?? "—"}</span></div>
              <div className="border-t border-[#D8E8F5] pt-3 flex justify-between font-bold"><span className="text-[#0D2137]">Total</span><span className="text-[#0050D0]">${Number(o.totalUSD).toFixed(2)}</span></div>
            </div>
            <Link href="/tickets"><Button variant="outline" className="w-full mt-5 border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] text-sm">Need Help? Open Ticket</Button></Link>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
