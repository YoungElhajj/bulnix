import { useState } from "react";
import { Package, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminOrders() {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.orders.list.useQuery({ page, limit: 50, status: status === "all" ? undefined : status }, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const updateOrder = trpc.admin.orders.update.useMutation({ onSuccess: () => { toast.success("Order updated"); utils.admin.orders.list.invalidate(); }, onError: e => toast.error(e.message) });
  const retryFulfillment = trpc.admin.orders.retryFulfillment.useMutation({ onSuccess: () => { toast.success("Fulfillment retry triggered"); utils.admin.orders.list.invalidate(); }, onError: e => toast.error(e.message) });

  const orders = (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;
  const statusBadge = (s: string) => ({ pending: "bg-yellow-500/10 text-yellow-400", processing: "bg-blue-500/10 text-blue-400", completed: "bg-[#EEF4FF] text-[#0050D0]", failed: "bg-red-500/10 text-red-400", refunded: "bg-orange-500/10 text-orange-400" }[s] ?? "bg-slate-500/10 text-[#4A6080]");

  return (
    <AdminLayout title="Orders">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-[#0D2137]">Orders</h1><p className="text-[#4A6080] text-sm mt-0.5">{total} total orders</p></div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={v=>{setStatus(v);setPage(1);}}>
            <SelectTrigger className="w-[140px] bg-white border-[#D8E8F5] text-[#0D2137] h-9"><SelectValue/></SelectTrigger>
            <SelectContent className="bg-white border-[#D8E8F5]">
              <SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_,i)=><div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl h-14 animate-pulse"/>)}</div>
      ) : (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#D8E8F5] text-[#4A6080] text-xs uppercase">
                <th className="text-left p-4">Order ID</th>
                <th className="text-left p-4">User</th>
                <th className="text-right p-4">Total</th>
                <th className="text-center p-4">Currency</th>
                <th className="text-center p-4">Status</th>
                <th className="text-center p-4">Payment</th>
                <th className="text-left p-4">Date</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-[#D8E8F5] hover:bg-white/3 transition-colors">
                    <td className="p-4 font-mono text-[#0D2137]">#{order.id}</td>
                    <td className="p-4 text-[#4A6080]">{order.billingEmail ?? "User #" + order.userId}</td>
                    <td className="p-4 text-right font-semibold text-[#0050D0]">${Number(order.totalUSD).toFixed(2)}</td>
                    <td className="p-4 text-center text-[#4A6080]">{order.currency}</td>
                    <td className="p-4 text-center"><Badge className={"text-xs border-0 " + statusBadge(order.status)}>{order.status}</Badge></td>
                    <td className="p-4 text-center text-[#4A6080] capitalize">{order.paymentGateway ?? "—"}</td>
                    <td className="p-4 text-[#4A6080] text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center gap-1 justify-center">
                        {order.status === "failed" && (
                          <button onClick={()=>retryFulfillment.mutate({orderId:order.id})} className="px-2 py-1 rounded bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20 text-xs transition-colors flex items-center gap-1">
                            <RefreshCw className="h-3 w-3"/> Retry
                          </button>
                        )}
                        <button onClick={()=>updateOrder.mutate({id:order.id,fraudFlag:!order.fraudFlag})} className={"px-2 py-1 rounded text-xs transition-colors " + (order.fraudFlag ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-slate-500/10 text-[#4A6080] hover:bg-slate-500/20")}>
                          {order.fraudFlag ? "Unflag" : "Flag"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 50 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-[#D8E8F5]">
              <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] h-8 text-xs" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
              <span className="text-[#4A6080] text-xs px-3">Page {page}</span>
              <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF] h-8 text-xs" disabled={orders.length < 50} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
