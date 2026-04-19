import { useState } from "react";
import { Package, RefreshCw, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface RefundDialogProps {
  order: { id: number; orderNumber?: string; totalUSD: string | number };
  onClose: () => void;
  onConfirm: (amountUSD: number, reason: string) => void;
  isLoading: boolean;
}

function RefundDialog({ order, onClose, onConfirm, isLoading }: RefundDialogProps) {
  const maxAmount = Number(order.totalUSD);
  const [amount, setAmount] = useState(maxAmount.toFixed(2));
  const [reason, setReason] = useState("");
  const amountNum = parseFloat(amount);
  const isValid = !isNaN(amountNum) && amountNum > 0 && amountNum <= maxAmount && reason.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161b22] border border-emerald-900/40 rounded-2xl p-6 w-full max-w-md shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <DollarSign className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Issue Refund</h2>
              <p className="text-slate-400 text-xs">Order #{order.orderNumber ?? order.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Refund Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input
                type="number"
                min="0.01"
                max={maxAmount}
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="pl-7 bg-[#0d1117] border-emerald-900/40 text-white placeholder:text-slate-500 focus:border-emerald-500"
                placeholder={maxAmount.toFixed(2)}
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">Max refundable: ${maxAmount.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium block mb-1.5">Reason for Refund</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Product not delivered, customer complaint, duplicate order..."
              className="w-full bg-[#0d1117] border border-emerald-900/40 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 text-xs text-orange-300">
            This will credit <strong>${isNaN(amountNum) ? "0.00" : amountNum.toFixed(2)}</strong> to the customer's Bulnix wallet and mark the order as <strong>refunded</strong>.
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 border-emerald-900/40 text-slate-400 hover:text-white hover:bg-white/5 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(amountNum, reason.trim())}
              disabled={!isValid || isLoading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Confirm Refund"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<{ id: number; orderNumber?: string; totalUSD: string | number } | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.orders.list.useQuery(
    { page, limit: 50, status: status === "all" ? undefined : status },
    { enabled: isAuthenticated && user?.role === "admin", retry: false }
  );
  const updateOrder = trpc.admin.orders.update.useMutation({
    onSuccess: () => { toast.success("Order updated"); utils.admin.orders.list.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const retryFulfillment = trpc.admin.orders.retryFulfillment.useMutation({
    onSuccess: () => { toast.success("Fulfillment retry triggered"); utils.admin.orders.list.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const manualRefund = trpc.admin.orders.manualRefund.useMutation({
    onSuccess: (result) => {
      toast.success(`Refund issued for order #${result.orderNumber}. Customer wallet credited.`);
      utils.admin.orders.list.invalidate();
      setRefundTarget(null);
    },
    onError: e => toast.error(e.message),
  });

  const orders = (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;

  const statusBadge = (s: string) => ({
    pending_payment: "bg-yellow-500/10 text-yellow-400",
    paid: "bg-cyan-500/10 text-cyan-400",
    processing: "bg-blue-500/10 text-blue-400",
    fulfilled: "bg-emerald-500/10 text-emerald-400",
    completed: "bg-emerald-500/10 text-emerald-400",
    failed: "bg-red-500/10 text-red-400",
    refunded: "bg-orange-500/10 text-orange-400",
    cancelled: "bg-slate-500/10 text-slate-400",
    disputed: "bg-purple-500/10 text-purple-400",
  }[s] ?? "bg-slate-500/10 text-slate-400");

  const canRefund = (s: string) => ["paid", "processing", "fulfilled", "completed", "failed", "partial"].includes(s);

  return (
    <AdminLayout title="Orders">
      {refundTarget && (
        <RefundDialog
          order={refundTarget}
          onClose={() => setRefundTarget(null)}
          onConfirm={(amountUSD, reason) => manualRefund.mutate({ orderId: refundTarget.id, amountUSD, reason })}
          isLoading={manualRefund.isPending}
        />
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total orders</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-[#0d1117] border-emerald-900/40 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-emerald-900/30">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending_payment">Pending Payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-[#161b22] border border-emerald-900/30 rounded-xl h-14 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-12 text-center">
          <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No orders found</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-emerald-900/30 text-slate-400 text-xs uppercase">
                  <th className="text-left p-4">Order</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-center p-4">Currency</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-center p-4">Payment</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-emerald-900/30 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-mono text-white text-xs">{order.orderNumber ?? `#${order.id}`}</div>
                      <div className="text-slate-500 text-xs">ID: {order.id}</div>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{order.billingEmail ?? "User #" + order.userId}</td>
                    <td className="p-4 text-right font-semibold text-emerald-400">${Number(order.totalUSD).toFixed(2)}</td>
                    <td className="p-4 text-center text-slate-400 text-xs">{order.currency}</td>
                    <td className="p-4 text-center">
                      <Badge className={"text-xs border-0 " + statusBadge(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="p-4 text-center text-slate-400 text-xs capitalize">{order.paymentGateway ?? "—"}</td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {order.status === "processing" || order.status === "failed" ? (
                          <button
                            onClick={() => retryFulfillment.mutate({ orderId: order.id })}
                            className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" /> Retry
                          </button>
                        ) : null}
                        {canRefund(order.status) && (
                          <button
                            onClick={() => setRefundTarget({ id: order.id, orderNumber: order.orderNumber, totalUSD: order.totalUSD })}
                            className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs transition-colors flex items-center gap-1"
                          >
                            <DollarSign className="h-3 w-3" /> Refund
                          </button>
                        )}
                        <button
                          onClick={() => updateOrder.mutate({ id: order.id, fraudFlag: !order.fraudFlag })}
                          className={"px-2 py-1 rounded text-xs transition-colors " + (order.fraudFlag ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20")}
                        >
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
            <div className="flex items-center justify-center gap-2 p-4 border-t border-emerald-900/30">
              <Button variant="outline" className="border-emerald-900/30 text-slate-400 hover:text-white hover:bg-[#0d1117] h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-slate-400 text-xs px-3">Page {page}</span>
              <Button variant="outline" className="border-emerald-900/30 text-slate-400 hover:text-white hover:bg-[#0d1117] h-8 text-xs" disabled={orders.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
