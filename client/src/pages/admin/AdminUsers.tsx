import { useState } from "react";
import { Users, Search, UserX, UserCheck, ChevronRight, Package, Wallet, MessageSquare, X, ExternalLink, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

function UserDetailPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data, isLoading } = trpc.admin.users.getDetail.useQuery({ userId }, { retry: false });
  const d = data as any;

  const statusColor: Record<string, string> = {
    fulfilled: "bg-[#EEF4FF] text-[#0050D0]",
    pending_payment: "bg-yellow-500/10 text-yellow-400",
    processing: "bg-[#EEF4FF] text-[#0050D0]",
    failed: "bg-red-500/10 text-red-400",
    refunded: "bg-purple-500/10 text-purple-400",
    cancelled: "bg-slate-500/10 text-[#4A6080]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-2xl bg-[#F5F9FF] border-l border-[#D8E8F5] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#F5F9FF] border-b border-[#D8E8F5] p-5 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-[#0D2137]">User Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#4A6080] hover:text-[#0D2137]"><X className="h-4 w-4" /></Button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-[#F5F9FF] animate-pulse" />)}</div>
        ) : !d ? (
          <div className="p-6 text-[#4A6080]">User not found.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile */}
            <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#00C2FF] flex items-center justify-center text-xl font-bold text-[#0D2137] shrink-0">
                  {(d.user.name ?? d.user.email ?? "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold text-[#0D2137] truncate">{d.user.name ?? "No name"}</div>
                  <div className="text-sm text-[#4A6080] truncate">{d.user.email ?? "No email"}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge className={d.user.role === "admin" ? "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs" : "bg-slate-500/10 text-[#4A6080] border-0 text-xs"}>{d.user.role}</Badge>
                    <Badge className={d.user.isSuspended ? "bg-red-500/10 text-red-400 border-0 text-xs" : "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs"}>{d.user.isSuspended ? "Suspended" : "Active"}</Badge>
                    <span className="text-xs text-[#4A6080]">Joined {new Date(d.user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-[#F5F9FF] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#0D2137]">{d.orders.length}</div>
                  <div className="text-xs text-[#4A6080]">Orders</div>
                </div>
                <div className="bg-[#F5F9FF] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#0D2137]">{d.tickets.length}</div>
                  <div className="text-xs text-[#4A6080]">Tickets</div>
                </div>
                <div className="bg-[#F5F9FF] rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#0050D0]">${Number(d.wallet?.balanceUSD ?? 0).toFixed(2)}</div>
                  <div className="text-xs text-[#4A6080]">Wallet</div>
                </div>
              </div>
            </div>

            {/* Orders */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-[#0050D0]" />
                <h3 className="text-sm font-bold text-[#0D2137]">Orders ({d.orders.length})</h3>
              </div>
              {d.orders.length === 0 ? (
                <div className="text-xs text-[#4A6080] py-3">No orders yet.</div>
              ) : (
                <div className="space-y-2">
                  {d.orders.map((order: any) => (
                    <div key={order.id} className="bg-white border border-[#D8E8F5] shadow-sm rounded-lg p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#4A6080]">#{order.id}</span>
                          <span className="text-xs font-mono text-[#4A6080] truncate">{order.orderNumber ?? "—"}</span>
                        </div>
                        <div className="text-xs text-[#4A6080] mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[#0D2137]">${Number(order.totalUSD ?? 0).toFixed(2)}</div>
                        <Badge className={`${statusColor[order.status] ?? "bg-slate-500/10 text-[#4A6080]"} border-0 text-xs mt-0.5`}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wallet Transactions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-4 w-4 text-[#0050D0]" />
                <h3 className="text-sm font-bold text-[#0D2137]">Wallet Transactions ({d.walletTransactions.length})</h3>
              </div>
              {d.walletTransactions.length === 0 ? (
                <div className="text-xs text-[#4A6080] py-3">No transactions yet.</div>
              ) : (
                <div className="space-y-2">
                  {d.walletTransactions.map((txn: any) => (
                    <div key={txn.id} className="bg-white border border-[#D8E8F5] shadow-sm rounded-lg p-3 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: txn.type === "deposit" || txn.type === "refund" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                        <DollarSign className="h-3 w-3" style={{ color: txn.type === "deposit" || txn.type === "refund" ? "#00C2FF" : "#ef4444" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#0D2137] truncate">{txn.description}</div>
                        <div className="text-xs text-[#4A6080]">{new Date(txn.createdAt).toLocaleString()}</div>
                      </div>
                      <div className={`text-sm font-bold shrink-0 ${txn.type === "deposit" || txn.type === "refund" ? "text-[#0050D0]" : "text-red-400"}`}>
                        {txn.type === "deposit" || txn.type === "refund" ? "+" : "-"}${Number(txn.amountUSD).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-[#0D2137]">Support Tickets ({d.tickets.length})</h3>
              </div>
              {d.tickets.length === 0 ? (
                <div className="text-xs text-[#4A6080] py-3">No tickets yet.</div>
              ) : (
                <div className="space-y-2">
                  {d.tickets.map((ticket: any) => (
                    <div key={ticket.id} className="bg-white border border-[#D8E8F5] shadow-sm rounded-lg p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#0D2137] truncate">{ticket.subject}</div>
                        <div className="text-xs text-[#4A6080] mt-0.5">{new Date(ticket.createdAt).toLocaleString()}</div>
                      </div>
                      <Badge className={
                        ticket.status === "open" ? "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs" :
                        ticket.status === "resolved" ? "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs" :
                        "bg-slate-500/10 text-[#4A6080] border-0 text-xs"
                      }>{ticket.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.users.list.useQuery(
    { page, limit: 50, search: search || undefined },
    { enabled: isAuthenticated && user?.role === "admin", retry: false }
  );
  const suspend = trpc.admin.users.suspend.useMutation({
    onSuccess: () => { toast.success("User suspended"); utils.admin.users.list.invalidate(); },
    onError: e => toast.error(e.message)
  });
  const reactivate = trpc.admin.users.reactivate.useMutation({
    onSuccess: () => { toast.success("User reactivated"); utils.admin.users.list.invalidate(); },
    onError: e => toast.error(e.message)
  });

  const userList = (data as any)?.items ?? (data as any)?.users ?? [];
  const total = (data as any)?.total ?? 0;

  return (
    <AdminLayout title="Users">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2137]">Users</h1>
          <p className="text-[#4A6080] text-sm mt-0.5">{total} registered users</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A6080]" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="pl-9 bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl h-14 animate-pulse" />)}</div>
      ) : userList.length === 0 ? (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-[#4A6080] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#0D2137] mb-2">No users found</h3>
          <p className="text-[#4A6080] text-sm">Users will appear here once they sign up.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D8E8F5] text-[#4A6080] text-xs uppercase">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-center p-4">Role</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u: any) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#D8E8F5] hover:bg-white/3 transition-colors cursor-pointer"
                    onClick={() => setSelectedUserId(u.id)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#00C2FF] flex items-center justify-center text-xs font-bold text-[#0D2137] shrink-0">
                          {(u.name ?? u.email ?? "U")[0].toUpperCase()}
                        </div>
                        <span className="text-[#0D2137] font-medium">{u.name ?? "No name"}</span>
                        <ChevronRight className="h-3 w-3 text-[#4A6080]" />
                      </div>
                    </td>
                    <td className="p-4 text-[#4A6080]">{u.email ?? "—"}</td>
                    <td className="p-4 text-center">
                      <Badge className={u.role === "admin" ? "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs" : "bg-slate-500/10 text-[#4A6080] border-0 text-xs"}>{u.role}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={u.isSuspended ? "bg-red-500/10 text-red-400 border-0 text-xs" : "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs"}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </Badge>
                    </td>
                    <td className="p-4 text-[#4A6080] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                      {u.isSuspended ? (
                        <button
                          onClick={() => reactivate.mutate({ userId: u.id })}
                          className="px-2 py-1 rounded bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20 text-xs transition-colors flex items-center gap-1 mx-auto"
                        >
                          <UserCheck className="h-3 w-3" /> Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspend.mutate({ userId: u.id })}
                          className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors flex items-center gap-1 mx-auto"
                        >
                          <UserX className="h-3 w-3" /> Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUserId !== null && (
        <UserDetailPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </AdminLayout>
  );
}
