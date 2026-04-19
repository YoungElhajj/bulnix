import { useState } from "react";
import {
  Ticket, Send, MessageSquare, DollarSign, RefreshCw,
  AlertCircle, FileText, ExternalLink, Loader2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import { useLocation } from "wouter";

export default function AdminTickets() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [closeTicket, setCloseTicket] = useState(false);

  // Customer refund state — quick inline refund (no dialog needed for small amounts)
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [processingRefundId, setProcessingRefundId] = useState<number | null>(null);

  // Supplier claim state
  const [showSupplierClaim, setShowSupplierClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({
    supplierOrderId: "",
    claimAmountUSD: "",
    reason: "",
    adminNotes: "",
    providerKey: "accszone",
  });
  const [createdClaimId, setCreatedClaimId] = useState<number | null>(null);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");

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
      toast.success(`Refund of $${refundAmount} processed instantly. Customer wallet credited $${Number(data.newBalance).toFixed(2)} total.`);
      setShowRefund(false);
      setRefundAmount("");
      setRefundReason("");
      setProcessingRefundId(null);
      utils.admin.tickets.list.invalidate();
    },
    onError: e => { toast.error(e.message); setProcessingRefundId(null); },
  });

  const createClaimMutation = trpc.admin.supplierRefunds.create.useMutation({
    onSuccess: (res) => {
      setCreatedClaimId(res.claimId);
      toast.success(`Supplier claim #${res.claimId} created as draft`);
    },
    onError: e => toast.error(e.message),
  });

  const submitClaimMutation = trpc.admin.supplierRefunds.submit.useMutation({
    onSuccess: (res) => {
      setClaimSubmitted(true);
      setSubmittedMessage(res.requestMessage ?? "");
      toast.success("Claim submitted! Copy the message and send it to AccsZone support.");
    },
    onError: e => toast.error(e.message),
  });

  const handleRefund = () => {
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid refund amount"); return; }
    const reason = refundReason.trim() || `Admin refund for ticket #${selected?.ticketNumber ?? selected?.id}`;
    setProcessingRefundId(selected.id);
    refundMutation.mutate({
      userId: selected.userId,
      amountUSD: amount,
      reason,
      orderId: selected.orderId ?? undefined,
      ticketId: selected.id,
    });
  };

  const openSupplierClaim = (ticket: any) => {
    setSelected(ticket);
    setCreatedClaimId(null);
    setClaimSubmitted(false);
    setSubmittedMessage("");
    setClaimForm({
      supplierOrderId: "",
      claimAmountUSD: "",
      reason: `Customer reported an issue with their order.\n\nTicket Subject: ${ticket.subject}\nTicket #: ${ticket.ticketNumber ?? ticket.id}${ticket.orderId ? `\nOrder #: ${ticket.orderId}` : ""}`,
      adminNotes: "",
      providerKey: "accszone",
    });
    setShowSupplierClaim(true);
  };

  const handleCreateClaim = () => {
    if (!claimForm.claimAmountUSD || !claimForm.reason) {
      toast.error("Amount and reason are required");
      return;
    }
    createClaimMutation.mutate({
      ticketId: selected.id,
      orderId: selected.orderId ?? undefined,
      providerKey: claimForm.providerKey,
      supplierOrderId: claimForm.supplierOrderId || undefined,
      claimAmountUSD: parseFloat(claimForm.claimAmountUSD),
      reason: claimForm.reason,
      adminNotes: claimForm.adminNotes || undefined,
    });
  };

  const handleSubmitClaim = () => {
    if (!createdClaimId) return;
    submitClaimMutation.mutate({ claimId: createdClaimId });
  };

  const closeSupplierClaim = () => {
    setShowSupplierClaim(false);
    setCreatedClaimId(null);
    setClaimSubmitted(false);
    setSubmittedMessage("");
  };

  const tickets = (data as any)?.items ?? (data as any)?.tickets ?? [];
  const total = (data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const statusColor = (s: string) => ({
    open: "bg-[#EEF4FF] text-[#0050D0] border-[#0050D0]/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    resolved: "bg-[#EEF4FF] text-[#0050D0] border-[#0050D0]/20",
    closed: "bg-slate-500/10 text-[#4A6080] border-slate-500/20",
  }[s] ?? "bg-slate-500/10 text-[#4A6080] border-slate-500/20");

  const priorityColor = (p: string) => ({
    low: "text-[#4A6080]", medium: "text-yellow-400", high: "text-orange-400", urgent: "text-red-400"
  }[p] ?? "text-[#4A6080]");

  return (
    <AdminLayout title="Support Tickets">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2137]">Support Tickets</h1>
          <p className="text-[#4A6080] text-sm mt-0.5">{total} total tickets</p>
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-white border-[#D8E8F5] text-[#0D2137] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#D8E8F5]">
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl h-14 animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl py-16 text-center">
          <Ticket className="h-12 w-12 text-[#4A6080] mx-auto mb-3" />
          <p className="text-[#4A6080]">No tickets found</p>
        </div>
      ) : (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D8E8F5] text-[#4A6080] text-xs uppercase">
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
                  <tr key={ticket.id} className="border-b border-[#D8E8F5] hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="text-[#0D2137] font-medium max-w-xs truncate">{ticket.subject}</div>
                      <div className="text-xs text-[#4A6080]">
                        #{ticket.ticketNumber ?? ticket.id}
                        {ticket.orderId && <span className="ml-2 text-[#4A6080]">Order #{ticket.orderId}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-[#4A6080] text-xs">User #{ticket.userId}</td>
                    <td className="p-4 text-center">
                      <span className={"text-xs font-semibold uppercase " + priorityColor(ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={"text-xs border " + statusColor(ticket.status)}>{ticket.status}</Badge>
                    </td>
                    <td className="p-4 text-[#4A6080] text-xs">{new Date(ticket.createdAt).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 justify-center flex-wrap">
                        <button
                          onClick={() => { setSelected(ticket); setReply(""); setCloseTicket(false); setShowRefund(false); setShowSupplierClaim(false); }}
                          className="px-2 py-1 rounded bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20 text-xs transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="h-3 w-3" /> Reply
                        </button>
                        <button
                          onClick={() => { setSelected(ticket); setShowRefund(true); setReply(""); setShowSupplierClaim(false); }}
                          className="px-2 py-1 rounded bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20 text-xs transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="h-3 w-3" /> Refund
                        </button>
                        <button
                          onClick={() => openSupplierClaim(ticket)}
                          className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs transition-colors flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" /> Supplier Claim
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-[#D8E8F5]">
              <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-[#4A6080] text-xs px-3">Page {page} of {totalPages}</span>
              <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] h-8 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!selected && !showRefund && !showSupplierClaim} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="bg-white border-[#D8E8F5] text-[#0D2137] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0D2137] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#0050D0]" />
              Reply to Ticket #{selected?.ticketNumber ?? selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-[#F5F9FF] rounded-lg">
                <div className="text-xs text-[#4A6080] mb-1">Subject</div>
                <div className="text-sm text-[#0D2137]">{selected.subject}</div>
                {selected.orderId && <div className="text-xs text-[#4A6080] mt-1">Order #{selected.orderId}</div>}
              </div>
              <div>
                <label className="text-xs text-[#4A6080] mb-1.5 block">Your Reply</label>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={5}
                  placeholder="Type your reply to the customer..."
                  className="w-full bg-[#F5F9FF] border border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] rounded-lg p-3 text-sm resize-none outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="close" checked={closeTicket} onChange={e => setCloseTicket(e.target.checked)} className="rounded" />
                <label htmlFor="close" className="text-sm text-[#4A6080]">Mark as resolved after reply</label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] flex-1" onClick={() => setSelected(null)}>Cancel</Button>
                <Button
                  className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] flex-1"
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

      {/* Customer Refund Dialog */}
      <Dialog open={!!selected && showRefund} onOpenChange={v => { if (!v) { setSelected(null); setShowRefund(false); } }}>
        <DialogContent className="bg-white border-[#D8E8F5] text-[#0D2137] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#0D2137] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#0050D0]" />
              Process Customer Refund
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-[#F5F9FF] rounded-lg text-sm">
                <div className="text-[#4A6080] text-xs mb-1">Ticket</div>
                <div className="text-[#0D2137]">{selected.subject}</div>
                <div className="text-[#4A6080] text-xs mt-1">User #{selected.userId}{selected.orderId ? ` · Order #${selected.orderId}` : ""}</div>
              </div>
              <div>
                <label className="text-xs text-[#4A6080] mb-1.5 block">Refund Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6080] font-semibold">$</span>
                  <Input
                    type="number" min="0.01" step="0.01"
                    value={refundAmount} onChange={e => setRefundAmount(e.target.value)}
                    className="pl-7 bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0]"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#4A6080] mb-1.5 block">Reason for Refund</label>
                <textarea
                  value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3}
                  placeholder="Describe the reason for this refund..."
                  className="w-full bg-[#F5F9FF] border border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] rounded-lg p-3 text-sm resize-none outline-none transition-colors"
                />
              </div>
              <div className="p-3 bg-[#00C2FF]/5 border border-[#0050D0]/20 rounded-lg text-xs text-[#4A6080]">
                The refund will be credited to the customer's Bulnix wallet balance. The ticket will be automatically marked as resolved.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-[#D8E8F5] text-[#4A6080] flex-1" onClick={() => { setSelected(null); setShowRefund(false); }}>Cancel</Button>
                <Button
                  className="bg-[#00C2FF] hover:bg-[#0215a8] text-[#0D2137] flex-1"
                  onClick={handleRefund} disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Claim Dialog */}
      <Dialog open={showSupplierClaim} onOpenChange={v => !v && closeSupplierClaim()}>
        <DialogContent className="bg-white border-[#D8E8F5] text-[#0D2137] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0D2137] flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Raise Supplier Refund Claim
            </DialogTitle>
          </DialogHeader>

          {selected && !claimSubmitted && (
            <div className="space-y-4 mt-2">
              {/* Ticket context banner */}
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-orange-400 text-xs font-medium mb-1">Linked to Ticket</p>
                <p className="text-[#0D2137] text-sm font-medium">{selected.subject}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-[#4A6080] text-xs">Ticket #{selected.ticketNumber ?? selected.id}</span>
                  {selected.orderId && <span className="text-[#4A6080] text-xs">Order #{selected.orderId}</span>}
                  <span className="text-[#4A6080] text-xs">User #{selected.userId}</span>
                </div>
              </div>

              {/* Claim already created */}
              {createdClaimId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#00C2FF]/5 border border-[#0050D0]/20 rounded-lg">
                    <p className="text-[#0050D0] font-medium text-sm mb-1">Claim #{createdClaimId} created as draft</p>
                    <p className="text-[#4A6080] text-xs">Click below to generate the formatted refund request message to send to AccsZone support.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF]"
                      onClick={() => { closeSupplierClaim(); navigate("/admin/supplier-refunds"); }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> View in Supplier Refunds
                    </Button>
                    <Button
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-[#0D2137]"
                      onClick={handleSubmitClaim}
                      disabled={submitClaimMutation.isPending}
                    >
                      {submitClaimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit to Supplier
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[#4A6080] text-xs mb-1.5 block">Supplier</Label>
                      <Select value={claimForm.providerKey} onValueChange={v => setClaimForm(f => ({ ...f, providerKey: v }))}>
                        <SelectTrigger className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#D8E8F5] text-[#0D2137]">
                          <SelectItem value="accszone">AccsZone</SelectItem>
                          <SelectItem value="accsbulk">AccsBulk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[#4A6080] text-xs mb-1.5 block">Claim Amount (USD) <span className="text-red-400">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6080] text-sm font-semibold">$</span>
                        <Input
                          type="number" min="0.01" step="0.01"
                          value={claimForm.claimAmountUSD}
                          onChange={e => setClaimForm(f => ({ ...f, claimAmountUSD: e.target.value }))}
                          className="pl-7 bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] h-9 text-sm focus:border-orange-400"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#4A6080] text-xs mb-1.5 block">Supplier Order ID <span className="text-[#4A6080]">(from AccsZone dashboard)</span></Label>
                    <Input
                      value={claimForm.supplierOrderId}
                      onChange={e => setClaimForm(f => ({ ...f, supplierOrderId: e.target.value }))}
                      placeholder="e.g. AZ-123456"
                      className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] h-9 text-sm focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <Label className="text-[#4A6080] text-xs mb-1.5 block">Reason for Claim <span className="text-red-400">*</span></Label>
                    <Textarea
                      value={claimForm.reason}
                      onChange={e => setClaimForm(f => ({ ...f, reason: e.target.value }))}
                      rows={5}
                      placeholder="Describe the issue clearly. This will be included in the message sent to the supplier."
                      className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-orange-400 resize-none text-sm"
                    />
                    <p className="text-[#4A6080] text-xs mt-1">Pre-filled from ticket subject. Edit as needed before submitting to supplier.</p>
                  </div>

                  <div>
                    <Label className="text-[#4A6080] text-xs mb-1.5 block">Internal Admin Notes <span className="text-[#4A6080]">(not sent to supplier)</span></Label>
                    <Textarea
                      value={claimForm.adminNotes}
                      onChange={e => setClaimForm(f => ({ ...f, adminNotes: e.target.value }))}
                      rows={2}
                      placeholder="Private notes for your team..."
                      className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-orange-400 resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1 border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF]" onClick={closeSupplierClaim}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-[#0D2137]"
                      onClick={handleCreateClaim}
                      disabled={createClaimMutation.isPending}
                    >
                      {createClaimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Create Draft Claim
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submitted state — show the formatted message to copy */}
          {claimSubmitted && submittedMessage && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <p className="text-green-400 font-medium text-sm mb-1">Claim submitted successfully</p>
                <p className="text-[#4A6080] text-xs">Copy the message below and send it to AccsZone via their support dashboard or email.</p>
              </div>
              <div className="bg-[#F5F9FF] rounded-lg p-4 border border-[#D8E8F5]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#4A6080] text-xs font-medium uppercase tracking-wide">Refund Request Message</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(submittedMessage); toast.success("Copied to clipboard"); }}
                    className="text-xs text-[#0050D0] hover:text-[#0D2137] transition-colors px-2 py-0.5 rounded bg-[#EEF4FF]"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-[#4A6080] text-xs whitespace-pre-wrap leading-relaxed font-mono">{submittedMessage}</pre>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#D8E8F5] text-[#4A6080] hover:text-[#0D2137] hover:bg-[#F5F9FF]"
                  onClick={() => { closeSupplierClaim(); navigate("/admin/supplier-refunds"); }}
                >
                  <FileText className="h-4 w-4 mr-2" /> View All Claims
                </Button>
                <Button className="flex-1 bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137]" onClick={closeSupplierClaim}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
