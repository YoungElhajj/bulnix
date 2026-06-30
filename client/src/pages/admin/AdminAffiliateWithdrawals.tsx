import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

type Withdrawal = {
  id: number; userId: number; amountUSD: string; bankName: string;
  accountNumber: string; accountName: string; status: string;
  adminNote: string | null; createdAt: Date;
  user?: { name: string | null; email: string };
};

export default function AdminAffiliateWithdrawals() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | undefined>("pending");
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const utils = trpc.useUtils();

  const { data: withdrawals, isLoading } = trpc.affiliate.adminGetWithdrawals.useQuery({ status: statusFilter });

  const processMutation = trpc.affiliate.adminProcess.useMutation({
    onSuccess: () => {
      utils.affiliate.adminGetWithdrawals.invalidate();
      setSelected(null); setAction(null); setAdminNote("");
      toast.success(`Withdrawal ${action === "approved" ? "approved" : "rejected"}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AdminLayout title="Affiliate Withdrawals">
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Affiliate Withdrawals</h1>
        <p className="text-sm text-slate-400 mt-0.5">Review and process affiliate payout requests</p>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
            className={statusFilter === s ? "bg-cyan-500 text-black" : "border-slate-600 text-slate-300"}
            onClick={() => setStatusFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : !withdrawals || withdrawals.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No {statusFilter} withdrawal requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w: any) => (
            <div key={w.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-white text-sm">{w.user?.name || w.user?.email || `User #${w.userId}`}</span>
                  <Badge className={w.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs" : w.status === "approved" ? "bg-green-500/20 text-green-400 text-xs" : "bg-red-500/20 text-red-400 text-xs"}>
                    {w.status}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-green-400">${Number(w.amountUSD).toFixed(2)}</p>
                <p className="text-xs text-slate-400">{w.bankName} · {w.accountNumber} · {w.accountName}</p>
                <p className="text-xs text-slate-500">{new Date(w.createdAt).toLocaleString()}</p>
                {w.adminNote && <p className="text-xs text-slate-400 italic">Note: {w.adminNote}</p>}
              </div>
              {w.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-black text-xs"
                    onClick={() => { setSelected(w); setAction("approved"); }}>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-900/50 text-red-400 hover:text-red-300 text-xs"
                    onClick={() => { setSelected(w); setAction("rejected"); }}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected && !!action} onOpenChange={() => { setSelected(null); setAction(null); setAdminNote(""); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{action === "approved" ? "Approve" : "Reject"} Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selected && (
              <div className="bg-slate-800 rounded-lg p-3 text-sm space-y-1">
                <p className="text-white font-medium">${Number(selected.amountUSD).toFixed(2)}</p>
                <p className="text-slate-400">{selected.bankName} · {selected.accountNumber}</p>
                <p className="text-slate-400">{selected.accountName}</p>
              </div>
            )}
            <div>
              <label className="text-slate-300 text-xs mb-1.5 block">Admin Note (optional)</label>
              <Textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} className="bg-slate-800 border-slate-600 text-white" rows={3}
                placeholder={action === "approved" ? "Payment sent via transfer..." : "Reason for rejection..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setSelected(null); setAction(null); }} className="text-slate-400">Cancel</Button>
            <Button className={action === "approved" ? "bg-green-500 hover:bg-green-600 text-black" : "bg-red-500 hover:bg-red-600 text-white"}
              disabled={processMutation.isPending}
              onClick={() => selected && action && processMutation.mutate({ id: selected.id, action, adminNote: adminNote || undefined })}>
              {processMutation.isPending ? "Processing..." : action === "approved" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
