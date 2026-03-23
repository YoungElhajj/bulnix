import { useState } from "react";
import {
  AlertCircle, CheckCircle, Clock, XCircle, Plus, Eye, Send,
  RefreshCw, DollarSign, FileText, MessageSquare, ChevronDown, ChevronUp, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:             { label: "Draft",              color: "bg-slate-500/20 text-slate-300 border-slate-500/30",    icon: <FileText className="h-3 w-3" /> },
  submitted:         { label: "Submitted",          color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       icon: <Send className="h-3 w-3" /> },
  acknowledged:      { label: "Acknowledged",       color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  approved:          { label: "Approved",           color: "bg-green-500/20 text-green-300 border-green-500/30",    icon: <CheckCircle className="h-3 w-3" /> },
  partially_approved:{ label: "Partially Approved", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: <AlertCircle className="h-3 w-3" /> },
  rejected:          { label: "Rejected",           color: "bg-red-500/20 text-red-300 border-red-500/30",          icon: <XCircle className="h-3 w-3" /> },
  resolved:          { label: "Resolved",           color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: <CheckCircle className="h-3 w-3" /> },
  cancelled:         { label: "Cancelled",          color: "bg-slate-600/20 text-slate-400 border-slate-600/30",    icon: <XCircle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function AdminSupplierRefunds() {
  const { isAuthenticated, user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [showLog, setShowLog] = useState(false);
  const [logEntry, setLogEntry] = useState("");
  const [logDirection, setLogDirection] = useState<"inbound" | "outbound">("inbound");

  const [form, setForm] = useState({
    ticketId: "", orderId: "", providerKey: "accszone",
    supplierOrderId: "", claimAmountUSD: "", reason: "", adminNotes: "",
  });

  const [updateForm, setUpdateForm] = useState({
    status: "", approvedAmountUSD: "", supplierResponse: "",
    supplierRefundRef: "", adminNotes: "",
    creditToCustomer: false, customerUserId: "",
  });

  const utils = trpc.useUtils();
  const enabled = isAuthenticated && user?.role === "admin";

  const { data, isLoading, refetch } = trpc.admin.supplierRefunds.list.useQuery(
    { page: 1, limit: 100, status: statusFilter === "all" ? undefined : statusFilter },
    { enabled, retry: false }
  );

  const { data: claimDetail, isLoading: loadingDetail } = trpc.admin.supplierRefunds.get.useQuery(
    { claimId: selectedClaim?.id ?? 0 },
    { enabled: enabled && !!selectedClaim?.id, retry: false }
  );

  const createClaim = trpc.admin.supplierRefunds.create.useMutation({
    onSuccess: (res) => {
      toast.success(`Claim #${res.claimId} created as draft`);
      setCreateOpen(false);
      setForm({ ticketId: "", orderId: "", providerKey: "accszone", supplierOrderId: "", claimAmountUSD: "", reason: "", adminNotes: "" });
      utils.admin.supplierRefunds.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const submitClaim = trpc.admin.supplierRefunds.submit.useMutation({
    onSuccess: (res) => {
      toast.success("Claim submitted! Copy the message below and send it to AccsZone support.");
      if (res.requestMessage) {
        navigator.clipboard.writeText(res.requestMessage).catch(() => {});
      }
      utils.admin.supplierRefunds.list.invalidate();
      utils.admin.supplierRefunds.get.invalidate({ claimId: selectedClaim?.id });
    },
    onError: e => toast.error(e.message),
  });

  const updateClaim = trpc.admin.supplierRefunds.update.useMutation({
    onSuccess: () => {
      toast.success("Claim updated");
      utils.admin.supplierRefunds.list.invalidate();
      utils.admin.supplierRefunds.get.invalidate({ claimId: selectedClaim?.id });
      setUpdateForm({ status: "", approvedAmountUSD: "", supplierResponse: "", supplierRefundRef: "", adminNotes: "", creditToCustomer: false, customerUserId: "" });
      setLogEntry("");
    },
    onError: e => toast.error(e.message),
  });

  const claims = (data?.items ?? []) as any[];

  const handleCreate = () => {
    if (!form.claimAmountUSD || !form.reason) return toast.error("Amount and reason are required");
    createClaim.mutate({
      ticketId: form.ticketId ? parseInt(form.ticketId) : undefined,
      orderId: form.orderId ? parseInt(form.orderId) : undefined,
      providerKey: form.providerKey,
      supplierOrderId: form.supplierOrderId || undefined,
      claimAmountUSD: parseFloat(form.claimAmountUSD),
      reason: form.reason,
      adminNotes: form.adminNotes || undefined,
    });
  };

  const handleUpdate = () => {
    const payload: any = { claimId: selectedClaim.id };
    if (updateForm.status) payload.status = updateForm.status;
    if (updateForm.approvedAmountUSD) payload.approvedAmountUSD = parseFloat(updateForm.approvedAmountUSD);
    if (updateForm.supplierResponse) payload.supplierResponse = updateForm.supplierResponse;
    if (updateForm.supplierRefundRef) payload.supplierRefundRef = updateForm.supplierRefundRef;
    if (updateForm.adminNotes) payload.adminNotes = updateForm.adminNotes;
    if (updateForm.creditToCustomer && updateForm.customerUserId) {
      payload.creditToCustomer = true;
      payload.customerUserId = parseInt(updateForm.customerUserId);
      if (updateForm.approvedAmountUSD) payload.approvedAmountUSD = parseFloat(updateForm.approvedAmountUSD);
    }
    updateClaim.mutate(payload);
  };

  const handleAddLog = () => {
    if (!logEntry.trim()) return toast.error("Log message is required");
    updateClaim.mutate({
      claimId: selectedClaim.id,
      addLogEntry: { message: logEntry, direction: logDirection, type: "note" },
    });
  };

  const openDetail = (claim: any) => {
    setSelectedClaim(claim);
    setDetailOpen(true);
    setShowLog(false);
  };

  const stats = {
    total: claims.length,
    draft: claims.filter(c => c.status === "draft").length,
    submitted: claims.filter(c => c.status === "submitted" || c.status === "acknowledged").length,
    approved: claims.filter(c => c.status === "approved" || c.status === "partially_approved").length,
    resolved: claims.filter(c => c.status === "resolved").length,
    totalClaimed: claims.reduce((s, c) => s + parseFloat(c.claimAmountUSD || "0"), 0),
    totalApproved: claims.reduce((s, c) => s + parseFloat(c.approvedAmountUSD || "0"), 0),
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Supplier Refund Claims</h1>
            <p className="text-slate-400 text-sm mt-1">Raise and track refund claims against AccsZone and other suppliers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white">
              <Plus className="h-4 w-4 mr-2" /> New Claim
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Claims", value: stats.total, sub: `${stats.draft} drafts`, color: "text-white" },
            { label: "In Progress", value: stats.submitted, sub: "submitted / acknowledged", color: "text-blue-400" },
            { label: "Approved", value: stats.approved, sub: `$${stats.totalApproved.toFixed(2)} approved`, color: "text-green-400" },
            { label: "Total Claimed", value: `$${stats.totalClaimed.toFixed(2)}`, sub: `${stats.resolved} resolved`, color: "text-[#00B9E9]" },
          ].map(s => (
            <div key={s.label} className="bg-[#0F172A] border border-white/5 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-600 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["all", "draft", "submitted", "acknowledged", "approved", "partially_approved", "rejected", "resolved", "cancelled"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === s
                  ? "bg-[#00B9E9]/20 text-[#00B9E9] border-[#00B9E9]/40"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>

        {/* Claims Table */}
        <div className="bg-[#0F172A] border border-white/5 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#00B9E9]" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No supplier refund claims yet</p>
              <p className="text-slate-600 text-sm mt-1">Create a claim when a customer reports an issue with a supplier order</p>
              <Button onClick={() => setCreateOpen(true)} className="mt-4 bg-[#00B9E9] hover:bg-[#00a8d4] text-white">
                <Plus className="h-4 w-4 mr-2" /> Create First Claim
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Claim #", "Provider", "Amount", "Supplier Order", "Ticket / Order", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map((claim: any) => (
                  <tr key={claim.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-white font-mono font-medium">#{claim.id}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-[#00B9E9]/10 text-[#00B9E9] text-xs font-medium uppercase">{claim.providerKey}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-semibold">${parseFloat(claim.claimAmountUSD).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{claim.supplierOrderId ?? <span className="text-slate-600">N/A</span>}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {claim.ticketId && <span className="mr-2">Ticket #{claim.ticketId}</span>}
                      {claim.orderId && <span>Order #{claim.orderId}</span>}
                      {!claim.ticketId && !claim.orderId && <span className="text-slate-600">N/A</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(claim.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" onClick={() => openDetail(claim)} className="text-slate-400 hover:text-white h-7 px-2">
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Claim Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#00B9E9]" /> New Supplier Refund Claim
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Ticket ID <span className="text-slate-600">(optional)</span></Label>
                <Input value={form.ticketId} onChange={e => setForm(f => ({ ...f, ticketId: e.target.value }))} placeholder="e.g. 42" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Order ID <span className="text-slate-600">(optional)</span></Label>
                <Input value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} placeholder="e.g. 101" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10" />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Supplier</Label>
              <Select value={form.providerKey} onValueChange={v => setForm(f => ({ ...f, providerKey: v }))}>
                <SelectTrigger className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-white/10 text-white">
                  <SelectItem value="accszone">AccsZone</SelectItem>
                  <SelectItem value="accsbulk">AccsBulk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Supplier Order ID <span className="text-slate-600">(from your AccsZone dashboard)</span></Label>
              <Input value={form.supplierOrderId} onChange={e => setForm(f => ({ ...f, supplierOrderId: e.target.value }))} placeholder="e.g. AZ-123456" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Claim Amount (USD) <span className="text-red-400">*</span></Label>
              <Input type="number" min="0.01" step="0.01" value={form.claimAmountUSD} onChange={e => setForm(f => ({ ...f, claimAmountUSD: e.target.value }))} placeholder="e.g. 5.00" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Reason for Claim <span className="text-red-400">*</span></Label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={4} placeholder="Describe the issue clearly. This text will be included in the refund request sent to the supplier." className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] resize-none" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Internal Admin Notes <span className="text-slate-600">(not sent to supplier)</span></Label>
              <Textarea value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))} rows={2} placeholder="Private notes for your team..." className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] resize-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-white/10 text-slate-300 hover:text-white hover:bg-white/5" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={handleCreate} disabled={createClaim.isPending}>
                {createClaim.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Draft Claim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Claim Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00B9E9]" />
              Claim #{selectedClaim?.id}
              {selectedClaim && <StatusBadge status={selectedClaim.status} />}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#00B9E9]" /></div>
          ) : claimDetail ? (
            <div className="space-y-5 mt-2">
              {/* Claim Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Provider", value: <span className="uppercase text-[#00B9E9] font-semibold">{claimDetail.providerKey}</span> },
                  { label: "Claim Amount", value: <span className="text-white font-bold">${parseFloat(claimDetail.claimAmountUSD as string).toFixed(2)}</span> },
                  { label: "Approved Amount", value: claimDetail.approvedAmountUSD ? <span className="text-green-400 font-semibold">${parseFloat(claimDetail.approvedAmountUSD as string).toFixed(2)}</span> : <span className="text-slate-600">Pending</span> },
                  { label: "Supplier Order ID", value: claimDetail.supplierOrderId ?? <span className="text-slate-600">N/A</span> },
                  { label: "Linked Ticket", value: claimDetail.ticketId ? `#${claimDetail.ticketId}` : <span className="text-slate-600">None</span> },
                  { label: "Linked Order", value: claimDetail.orderId ? `#${claimDetail.orderId}` : <span className="text-slate-600">None</span> },
                  { label: "Supplier Ref", value: claimDetail.supplierRefundRef ?? <span className="text-slate-600">Not yet assigned</span> },
                  { label: "Credited to Customer", value: claimDetail.creditedToCustomer ? <span className="text-green-400">Yes</span> : <span className="text-slate-500">No</span> },
                ].map(row => (
                  <div key={row.label} className="bg-[#0B0F19] rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">{row.label}</p>
                    <p className="text-slate-200">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Reason */}
              <div className="bg-[#0B0F19] rounded-lg p-4">
                <p className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wide">Claim Reason</p>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{claimDetail.reason}</p>
              </div>

              {/* Supplier Response */}
              {claimDetail.supplierResponse && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-400 text-xs mb-2 font-medium uppercase tracking-wide">Supplier Response</p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{claimDetail.supplierResponse}</p>
                </div>
              )}

              {/* Admin Notes */}
              {claimDetail.adminNotes && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-400 text-xs mb-2 font-medium uppercase tracking-wide">Internal Notes</p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{claimDetail.adminNotes}</p>
                </div>
              )}

              {/* Submit Button for Draft Claims */}
              {claimDetail.status === "draft" && (
                <div className="bg-[#00B9E9]/5 border border-[#00B9E9]/20 rounded-lg p-4">
                  <p className="text-[#00B9E9] text-sm font-medium mb-2">Ready to submit this claim?</p>
                  <p className="text-slate-400 text-xs mb-3">Submitting will generate a formatted refund request message. Copy it and send it to AccsZone support via their dashboard or email.</p>
                  <Button onClick={() => submitClaim.mutate({ claimId: claimDetail.id })} disabled={submitClaim.isPending} className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white w-full">
                    {submitClaim.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Submit Claim to Supplier
                  </Button>
                </div>
              )}

              {/* Update Status Form */}
              {claimDetail.status !== "resolved" && claimDetail.status !== "cancelled" && (
                <div className="bg-[#0B0F19] rounded-lg p-4 space-y-3">
                  <p className="text-slate-300 text-sm font-medium">Update Claim</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">New Status</Label>
                      <Select value={updateForm.status} onValueChange={v => setUpdateForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger className="bg-[#0F172A] border-white/10 text-white h-9 text-sm">
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0F172A] border-white/10 text-white">
                          {["acknowledged", "approved", "partially_approved", "rejected", "resolved", "cancelled"].map(s => (
                            <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs mb-1.5 block">Approved Amount (USD)</Label>
                      <Input type="number" value={updateForm.approvedAmountUSD} onChange={e => setUpdateForm(f => ({ ...f, approvedAmountUSD: e.target.value }))} placeholder="0.00" className="bg-[#0F172A] border-white/10 text-white h-9 text-sm" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Supplier Refund Reference</Label>
                    <Input value={updateForm.supplierRefundRef} onChange={e => setUpdateForm(f => ({ ...f, supplierRefundRef: e.target.value }))} placeholder="e.g. REF-AZ-789" className="bg-[#0F172A] border-white/10 text-white h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs mb-1.5 block">Supplier Response Message</Label>
                    <Textarea value={updateForm.supplierResponse} onChange={e => setUpdateForm(f => ({ ...f, supplierResponse: e.target.value }))} rows={2} placeholder="Paste supplier's reply here..." className="bg-[#0F172A] border-white/10 text-white resize-none text-sm" />
                  </div>
                  {(updateForm.status === "approved" || updateForm.status === "partially_approved") && (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-2">
                      <p className="text-green-400 text-xs font-medium">Credit Approved Amount to Customer Wallet?</p>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="creditCheck" checked={updateForm.creditToCustomer} onChange={e => setUpdateForm(f => ({ ...f, creditToCustomer: e.target.checked }))} className="h-4 w-4 accent-green-500" />
                        <label htmlFor="creditCheck" className="text-slate-300 text-sm">Yes, credit customer wallet</label>
                      </div>
                      {updateForm.creditToCustomer && (
                        <div>
                          <Label className="text-slate-400 text-xs mb-1.5 block">Customer User ID</Label>
                          <Input value={updateForm.customerUserId} onChange={e => setUpdateForm(f => ({ ...f, customerUserId: e.target.value }))} placeholder="User ID from Admin > Users" className="bg-[#0F172A] border-white/10 text-white h-9 text-sm" />
                        </div>
                      )}
                    </div>
                  )}
                  <Button onClick={handleUpdate} disabled={updateClaim.isPending} className="w-full bg-[#00B9E9] hover:bg-[#00a8d4] text-white">
                    {updateClaim.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Update
                  </Button>
                </div>
              )}

              {/* Communication Log */}
              <div>
                <button
                  onClick={() => setShowLog(!showLog)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors w-full"
                >
                  <MessageSquare className="h-4 w-4" />
                  Communication Log ({(claimDetail.communicationLog as any[])?.length ?? 0} entries)
                  {showLog ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>

                {showLog && (
                  <div className="mt-3 space-y-3">
                    {((claimDetail.communicationLog as any[]) ?? []).length === 0 ? (
                      <p className="text-slate-600 text-sm text-center py-4">No log entries yet</p>
                    ) : (
                      (claimDetail.communicationLog as any[]).map((entry: any, i: number) => (
                        <div key={i} className={`rounded-lg p-3 text-sm ${entry.direction === "inbound" ? "bg-blue-500/5 border border-blue-500/20 ml-4" : "bg-[#0B0F19] border border-white/5 mr-4"}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${entry.direction === "inbound" ? "text-blue-400" : "text-slate-400"}`}>
                              {entry.direction === "inbound" ? "From Supplier" : "From Admin"} — {entry.actor}
                            </span>
                            <span className="text-slate-600 text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                        </div>
                      ))
                    )}

                    {/* Add Log Entry */}
                    <div className="bg-[#0B0F19] rounded-lg p-3 space-y-2 mt-2">
                      <p className="text-slate-400 text-xs font-medium">Add Log Entry</p>
                      <div className="flex gap-2">
                        <Select value={logDirection} onValueChange={v => setLogDirection(v as any)}>
                          <SelectTrigger className="bg-[#0F172A] border-white/10 text-white h-8 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0F172A] border-white/10 text-white">
                            <SelectItem value="inbound">From Supplier</SelectItem>
                            <SelectItem value="outbound">From Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={logEntry} onChange={e => setLogEntry(e.target.value)} placeholder="Enter message..." className="bg-[#0F172A] border-white/10 text-white h-8 text-xs flex-1" />
                        <Button size="sm" onClick={handleAddLog} disabled={updateClaim.isPending} className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white h-8 px-3">
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
