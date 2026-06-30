import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key, Search, User, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

export default function AdminApiAccess() {
  const [search, setSearch] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ id: number; label: string; userName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvedKey, setApprovedKey] = useState<{ rawKey: string; keyPrefix: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: apiKeys, isLoading } = trpc.apiKeys.adminList.useQuery();

  const approveMutation = trpc.apiKeys.adminApprove.useMutation({
    onSuccess: (data) => {
      toast.success("API key approved and user notified.");
      setApprovedKey(data);
      utils.apiKeys.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = trpc.apiKeys.adminReject.useMutation({
    onSuccess: () => {
      toast.success("API key request rejected.");
      setRejectDialog(null);
      setRejectReason("");
      utils.apiKeys.adminList.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.apiKeys.adminToggle.useMutation({
    onSuccess: () => { toast.success("API key updated"); utils.apiKeys.adminList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (apiKeys ?? []).filter((k: any) => {
    const q = search.toLowerCase();
    return !q || (k.userName ?? "").toLowerCase().includes(q) || (k.userEmail ?? "").toLowerCase().includes(q) || k.label.toLowerCase().includes(q);
  });

  const pending = filtered.filter((k: any) => k.status === "pending");
  const active = filtered.filter((k: any) => k.status === "active");
  const rejected = filtered.filter((k: any) => k.status === "rejected");

  const KeyCard = ({ k }: { k: any }) => (
    <div className="bg-[#161b27] border border-slate-700/60 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            k.status === "active" ? "bg-green-500/15" :
            k.status === "pending" ? "bg-yellow-500/15" : "bg-red-500/15"
          }`}>
            {k.status === "active" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
             k.status === "pending" ? <Clock className="w-4 h-4 text-yellow-400" /> :
             <XCircle className="w-4 h-4 text-red-400" />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{k.label}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-slate-400 truncate">{k.userName ?? "Unknown"} · {k.userEmail ?? ""}</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={`text-xs shrink-0 ${
          k.status === "active" ? "border-green-500/30 text-green-400" :
          k.status === "pending" ? "border-yellow-500/30 text-yellow-400" :
          "border-red-500/30 text-red-400"
        }`}>
          {k.status}
        </Badge>
      </div>

      {k.status === "active" && k.keyPrefix && (
        <p className="text-xs text-slate-500 font-mono">{k.keyPrefix}••••••••••••••••••••••••••••••••••••••••</p>
      )}
      {k.status === "rejected" && k.adminNote && (
        <p className="text-xs text-red-400/70">Reason: {k.adminNote}</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-slate-600">Requested {new Date(k.createdAt).toLocaleDateString()}</p>
        <div className="flex gap-2">
          {k.status === "pending" && (
            <>
              <Button
                size="sm"
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 h-7 text-xs gap-1"
                onClick={() => approveMutation.mutate({ id: k.id })}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-7 text-xs gap-1"
                onClick={() => setRejectDialog({ id: k.id, label: k.label, userName: k.userName ?? "User" })}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </>
          )}
          {k.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              className={`h-7 text-xs border-slate-600 bg-transparent ${k.adminEnabled ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}`}
              onClick={() => toggleMutation.mutate({ id: k.id, adminEnabled: !k.adminEnabled })}
            >
              {k.adminEnabled ? "Disable" : "Re-enable"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Key className="w-6 h-6 text-cyan-400" /> API Access Control
            </h1>
            <p className="text-slate-400 text-sm mt-1">Review and manage API key requests from users.</p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5 text-yellow-400">
              <span className="font-bold">{(apiKeys ?? []).filter((k: any) => k.status === "pending").length}</span> Pending
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5 text-green-400">
              <span className="font-bold">{(apiKeys ?? []).filter((k: any) => k.status === "active").length}</span> Active
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by user name, email or key label..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-[#161b27] border-slate-700 text-white"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : (
          <div className="space-y-8">
            {/* Pending */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <h2 className="font-semibold text-white">Pending Requests ({pending.length})</h2>
                </div>
                {pending.map((k: any) => <KeyCard key={k.id} k={k} />)}
              </div>
            )}

            {/* Active */}
            {active.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <h2 className="font-semibold text-white">Active Keys ({active.length})</h2>
                </div>
                {active.map((k: any) => <KeyCard key={k.id} k={k} />)}
              </div>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <h2 className="font-semibold text-white">Rejected ({rejected.length})</h2>
                </div>
                {rejected.map((k: any) => <KeyCard key={k.id} k={k} />)}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
                {search ? "No results found." : "No API key requests yet."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectReason(""); } }}>
        <DialogContent className="bg-[#161b27] border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Reject API Key Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-400">
              Rejecting key <span className="text-white font-medium">"{rejectDialog?.label}"</span> for <span className="text-white font-medium">{rejectDialog?.userName}</span>.
            </p>
            <Input
              placeholder="Reason for rejection (required)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-slate-600 text-slate-400 bg-transparent" onClick={() => { setRejectDialog(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectDialog && rejectMutation.mutate({ id: rejectDialog.id, reason: rejectReason.trim() })}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approved Key Info Dialog */}
      <Dialog open={!!approvedKey} onOpenChange={(open) => { if (!open) setApprovedKey(null); }}>
        <DialogContent className="bg-[#161b27] border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" /> API Key Approved
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-300">The user has been notified via in-app notification. They can view their key prefix in their API Keys page.</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Key prefix (for your records):</p>
              <div className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 font-mono text-sm text-cyan-300">
                {approvedKey?.keyPrefix}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button className="bg-slate-700 hover:bg-slate-600 text-white w-full" onClick={() => setApprovedKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
