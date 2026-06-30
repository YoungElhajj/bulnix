import { useState } from "react";
import { Package, RefreshCw, DollarSign, X, Search, ChevronLeft, User, CreditCard, Truck, ShoppingCart } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [refundTarget, setRefundTarget] = useState<{ id: number; orderNumber?: string; totalUSD: string | number } | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.orders.list.useQuery(
    { page, limit: 50, status: status === "all" ? undefined : status, search: search || undefined },
    { enabled: isAuthenticated && user?.role === "admin", retry: false }
  );
  const { data: orderDetail, isLoading: detailLoading } = trpc.admin.orders.getDetail.useQuery(
    { orderId: selectedOrderId! },
    { enabled: selectedOrderId !== null && isAuthenticated && user?.role === "admin", retry: false }
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

  // ── Order Detail View ──────────────────────────────────────────────────────
  if (selectedOrderId !== null) {
    const detail = orderDetail as any;
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
        <div className="mb-5">
          <button onClick={() => setSelectedOrderId(null)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Orders
          </button>
        </div>
        {detailLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !detail ? (
          <div className="text-center py-20 text-slate-400">Order not found</div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Order {detail.order.orderNumber ?? `#${detail.order.id}`}</h1>
                <p className="text-slate-400 text-sm mt-0.5">{new Date(detail.order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={"text-sm border-0 px-3 py-1 " + statusBadge(detail.order.status)}>{detail.order.status}</Badge>
                {(detail.order.status === "processing" || detail.order.status === "failed") && (
                  <Button size="sm" onClick={() => retryFulfillment.mutate({ orderId: detail.order.id })} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry Fulfillment
                  </Button>
                )}
                {canRefund(detail.order.status) && (
                  <Button size="sm" onClick={() => setRefundTarget({ id: detail.order.id, orderNumber: detail.order.orderNumber, totalUSD: detail.order.totalUSD })} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Issue Refund
                  </Button>
                )}
              </div>
            </div>

            {/* Customer + Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-white font-semibold text-sm">Customer</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Name</span><span className="text-white text-right">{detail.user?.name ?? "—"}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Email</span><span className="text-white text-right text-xs break-all">{detail.user?.email ?? detail.order.billingEmail ?? "—"}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Wallet Balance</span><span className="text-emerald-400">${Number(detail.user?.walletBalanceUSD ?? 0).toFixed(2)}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Country</span><span className="text-white">{detail.order.billingCountry ?? "—"}</span></div>
                </div>
              </div>
              <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span className="text-white font-semibold text-sm">Payment</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Total (USD)</span><span className="text-emerald-400 font-bold">${Number(detail.order.totalUSD).toFixed(2)}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Currency</span><span className="text-white">{detail.order.currency}</span></div>
                  {detail.payments.length > 0 && <>
                    <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Gateway</span><span className="text-white capitalize">{detail.payments[0].gateway ?? "—"}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Reference</span><span className="text-white font-mono text-xs break-all">{detail.payments[0].reference ?? "—"}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Status</span><span className="text-white capitalize">{detail.payments[0].status ?? "—"}</span></div>
                  </>}
                  {detail.order.couponCode && <div className="flex justify-between gap-2"><span className="text-slate-400 shrink-0">Coupon</span><span className="text-white">{detail.order.couponCode}</span></div>}
                  {detail.order.adminNotes && <div className="mt-2 p-2 bg-yellow-500/5 border border-yellow-500/20 rounded text-yellow-300 text-xs">{detail.order.adminNotes}</div>}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-4 w-4 text-emerald-400" />
                <span className="text-white font-semibold text-sm">Items Ordered ({detail.items.length})</span>
              </div>
              {detail.items.length === 0 ? (
                <p className="text-slate-500 text-sm">No items found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase border-b border-emerald-900/30">
                        <th className="text-left pb-2 pr-4">Product</th>
                        <th className="text-center pb-2 px-2">Qty</th>
                        <th className="text-right pb-2 px-2">Unit Price</th>
                        <th className="text-right pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item: any) => (
                        <tr key={item.id} className="border-b border-emerald-900/20 last:border-0">
                          <td className="py-2.5 pr-4 text-white">{item.productTitle ?? `Product #${item.productId}`}</td>
                          <td className="py-2.5 text-center text-slate-300 px-2">{item.quantity}</td>
                          <td className="py-2.5 text-right text-slate-300 px-2">${Number(item.unitPriceUSD).toFixed(2)}</td>
                          <td className="py-2.5 text-right text-emerald-400 font-semibold">${Number(item.subtotalUSD).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="pt-3 text-right text-slate-400 font-semibold text-sm pr-2">Total</td>
                        <td className="pt-3 text-right text-emerald-400 font-bold">${Number(detail.order.totalUSD).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Fulfillment */}
            <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-4 w-4 text-emerald-400" />
                <span className="text-white font-semibold text-sm">Fulfillment Records ({detail.fulfillments.length})</span>
              </div>
              {detail.fulfillments.length === 0 ? (
                <p className="text-slate-500 text-sm">No fulfillment records yet</p>
              ) : (
                <div className="space-y-3">
                  {detail.fulfillments.map((f: any) => (
                    <div key={f.id} className="border border-emerald-900/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={"text-xs border-0 " + (f.status === "success" ? "bg-emerald-500/10 text-emerald-400" : f.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400")}>{f.status}</Badge>
                          <span className="text-slate-400 text-xs capitalize">{f.provider ?? "—"}</span>
                        </div>
                        <span className="text-slate-500 text-xs">{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                      {f.deliveredData && (
                        <div className="mt-2">
                          <p className="text-slate-400 text-xs mb-1">Delivered Data:</p>
                          <pre className="bg-[#0d1117] rounded p-3 text-emerald-300 text-xs overflow-x-auto whitespace-pre-wrap break-all">{typeof f.deliveredData === "string" ? f.deliveredData : JSON.stringify(f.deliveredData, null, 2)}</pre>
                        </div>
                      )}
                      {f.errorMessage && <p className="text-red-400 text-xs mt-2">Error: {f.errorMessage}</p>}
                      {f.supplierOrderId && <p className="text-slate-400 text-xs mt-1">Supplier Order ID: <span className="text-white font-mono">{f.supplierOrderId}</span></p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AdminLayout>
    );
  }

  // ── Orders List View ───────────────────────────────────────────────────────
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
        <div className="flex items-center gap-3 flex-wrap">
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search order # or email…"
                className="pl-8 h-9 w-[200px] sm:w-[240px] bg-[#0d1117] border-emerald-900/40 text-white placeholder:text-slate-500 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">Search</Button>
            {search && (
              <Button type="button" size="sm" variant="outline" className="h-9 border-emerald-900/40 text-slate-400 hover:text-white bg-transparent text-xs" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
                Clear
              </Button>
            )}
          </form>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[150px] bg-[#0d1117] border-emerald-900/40 text-white h-9">
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
                  <th className="text-center p-4 hidden sm:table-cell">Currency</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-left p-4 hidden md:table-cell">Date</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-emerald-900/30 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="p-4">
                      <div className="font-mono text-emerald-400 text-xs hover:underline">{order.orderNumber ?? `#${order.id}`}</div>
                      <div className="text-slate-500 text-xs">ID: {order.id}</div>
                    </td>
                    <td className="p-4 text-slate-400 text-xs max-w-[150px] truncate">{order.billingEmail ?? "User #" + order.userId}</td>
                    <td className="p-4 text-right font-semibold text-emerald-400">${Number(order.totalUSD).toFixed(2)}</td>
                    <td className="p-4 text-center text-slate-400 text-xs hidden sm:table-cell">{order.currency}</td>
                    <td className="p-4 text-center">
                      <Badge className={"text-xs border-0 " + statusBadge(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="p-4 text-slate-400 text-xs hidden md:table-cell">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-center flex-wrap">
                        {(order.status === "processing" || order.status === "failed") && (
                          <button
                            onClick={() => retryFulfillment.mutate({ orderId: order.id })}
                            className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="h-3 w-3" /> Retry
                          </button>
                        )}
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
              <span className="text-slate-400 text-xs px-3">Page {page} of {Math.ceil(total / 50)}</span>
              <Button variant="outline" className="border-emerald-900/30 text-slate-400 hover:text-white hover:bg-[#0d1117] h-8 text-xs" disabled={orders.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
