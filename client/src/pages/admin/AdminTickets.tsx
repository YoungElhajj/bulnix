import { useState } from "react";
import { Ticket, Send, MessageSquare, DollarSign, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminTickets() {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [closeTicket, setCloseTicket] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.tickets.list.useQuery(
    { page, limit: 50, status: status === "all" ? undefined : status },
    { enabled: isAuthenticated && user?.role === "admin", retry: false }
  );

  const replyMutation = trpc.admin.tickets.reply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent successfully");
      setSelected(null);
      setReply("");
      setCloseTicket(false);
      utils.admin.tickets.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const refundMutation = trpc.admin.refunds.process.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Refund of $${refundAmount} processed. New balance: $${Number(data.newBalance).toFixed(2)}`);
      setShowRefund(false);
      setRefundAmount("");
      setRefundReason("");
      utils.admin.tickets.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const handleRefund = () => {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid refund amount"); return; }
    if (!refundReason.trim() || refundReason.length < 5) { toast.error("Please provide a reason (at least 5 characters)"); return; }
    refundMutation.mutate({
      userId: selected.userId,
      amountUSD: amount,
      reason: refundReason,
      orderId: selected.orderId ?? undefined,
      ticketId: selected.id,
    });
  };

  const tickets = (data as any)?.items ?? (data as any)?.tickets ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const statusColor = (s: string) => ({
    open: "bg-[#00B9E9]/10 text-[#00B9E9] border-[#00B9E9]/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    resolved: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
    closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }[s] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20");

  const priorityColor = (p: string) => ({
    low: "text-slate-400", medium: "text-yellow-400", high: "text-orange-400", urgent: "text-red-400"
  }[p] ?? "text-slate-400");

  return (
    <AdminLayout title="Support Tickets">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total tickets</p>
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-[#0F172A] border-white/10 text-white h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0F172A] border-white/10">
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="glass-card rounded-xl h-14 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="glass-card rounded-xl py-16 text-center">
          <Ticket className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No tickets found</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-xs uppercase">
                  <th className="text-left p-4">Ticket</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-center p-4">Priority</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="text-white font-medium max-w-xs truncate">{ticket.subject}</div>
                      <div className="text-xs text-slate-500">#{ticket.ticketNumber ?? ticket.id}</div>
                    </td>
                    <td className="p-4 text-slate-300 text-xs">User #{ticket.userId}</td>
                    <td className="p-4 text-center">
                      <span className={"text-xs font-semibold uppercase " + priorityColor(ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={"text-xs border " + statusColor(ticket.status)}>{ticket.status}</Badge>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(ticket.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => { setSelected(ticket); setReply(""); setCloseTicket(false); setShowRefund(false); }}
                          className="px-2 py-1 rounded bg-[#00B9E9]/10 text-[#00B9E9] hover:bg-[#00B9E9]/20 text-xs transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="h-3 w-3" /> Reply
                        </button>
                        <button
                          onClick={() => { setSelected(ticket); setShowRefund(true); setReply(""); }}
                          className="px-2 py-1 rounded bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 text-xs transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="h-3 w-3" /> Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
              <Button variant="outline" className="border-white/10 text-slate-400 h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-slate-500 text-xs px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" className="border-white/10 text-slate-400 h-8 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!selected && !showRefund} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#00B9E9]" />
              Reply to Ticket #{selected?.ticketNumber ?? selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">Subject</div>
                <div className="text-sm text-white">{selected.subject}</div>
                {selected.orderId && <div className="text-xs text-slate-500 mt-1">Order #{selected.orderId}</div>}
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Your Reply</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={5}
                  placeholder="Type your reply to the customer..."
                  className="w-full bg-[#0B0F19] border border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] rounded-lg p-3 text-sm resize-none outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="close" checked={closeTicket} onChange={e => setCloseTicket(e.target.checked)} className="rounded" />
                <label htmlFor="close" className="text-sm text-slate-300">Mark as resolved after reply</label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/10 text-slate-400 flex-1" onClick={() => setSelected(null)}>Cancel</Button>
                <Button
                  className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white flex-1"
                  onClick={() => replyMutation.mutate({ ticketId: selected.id, message: reply, closeTicket })}
                  disabled={!reply.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={!!selected && showRefund} onOpenChange={v => { if (!v) { setSelected(null); setShowRefund(false); } }}>
        <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#22C55E]" />
              Process Refund
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-white/5 rounded-lg text-sm">
                <div className="text-slate-500 text-xs mb-1">Ticket</div>
                <div className="text-white">{selected.subject}</div>
                <div className="text-slate-500 text-xs mt-1">User #{selected.userId}{selected.orderId ? ` · Order #${selected.orderId}` : ""}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Refund Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    className="pl-7 bg-[#0B0F19] border-white/10 text-white focus:border-[#22C55E]"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Reason for Refund</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the reason for this refund..."
                  className="w-full bg-[#0B0F19] border border-white/10 text-white placeholder:text-slate-600 focus:border-[#22C55E] rounded-lg p-3 text-sm resize-none outline-none transition-colors"
                />
              </div>
              <div className="p-3 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg text-xs text-slate-400">
                The refund will be credited to the customer's Bulnix wallet balance. The ticket will be automatically marked as resolved.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/10 text-slate-400 flex-1" onClick={() => { setSelected(null); setShowRefund(false); }}>Cancel</Button>
                <Button
                  className="bg-[#22C55E] hover:bg-[#16a34a] text-white flex-1"
                  onClick={handleRefund}
                  disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
