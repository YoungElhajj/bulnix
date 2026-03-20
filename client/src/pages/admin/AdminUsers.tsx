import { useState } from "react";
import { Users, Search, UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminUsers() {
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.users.list.useQuery({ page, limit: 50, search: search || undefined }, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const suspend = trpc.admin.users.suspend.useMutation({ onSuccess: () => { toast.success("User suspended"); utils.admin.users.list.invalidate(); }, onError: e => toast.error(e.message) });
  const reactivate = trpc.admin.users.reactivate.useMutation({ onSuccess: () => { toast.success("User reactivated"); utils.admin.users.list.invalidate(); }, onError: e => toast.error(e.message) });

  const users = (data as any)?.users ?? [];
  const total = (data as any)?.total ?? 0;

  return (
    <AdminLayout title="Users">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">Users</h1><p className="text-slate-500 text-sm mt-0.5">{total} registered users</p></div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"/>
          <Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search users..." className="pl-9 bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-9"/>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_,i)=><div key={i} className="glass-card rounded-xl h-14 animate-pulse"/>)}</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-slate-500 text-xs uppercase">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Email</th>
                <th className="text-center p-4">Role</th>
                <th className="text-center p-4">Status</th>
                <th className="text-left p-4">Joined</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B9E9] to-[#22C55E] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {(u.name ?? u.email ?? "U")[0].toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{u.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{u.email ?? "—"}</td>
                    <td className="p-4 text-center"><Badge className={u.role === "admin" ? "bg-[#00B9E9]/10 text-[#00B9E9] border-0 text-xs" : "bg-slate-500/10 text-slate-400 border-0 text-xs"}>{u.role}</Badge></td>
                    <td className="p-4 text-center"><Badge className={(u as any).isSuspended ? "bg-red-500/10 text-red-400 border-0 text-xs" : "bg-[#22C55E]/10 text-[#22C55E] border-0 text-xs"}>{(u as any).isSuspended ? "suspended" : "active"}</Badge></td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      {(u as any).isSuspended ? (
                        <button onClick={()=>reactivate.mutate({userId:u.id})} className="px-2 py-1 rounded bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 text-xs transition-colors flex items-center gap-1 mx-auto">
                          <UserCheck className="h-3 w-3"/> Reactivate
                        </button>
                      ) : (
                        <button onClick={()=>suspend.mutate({userId:u.id})} className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs transition-colors flex items-center gap-1 mx-auto">
                          <UserX className="h-3 w-3"/> Suspend
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
    </AdminLayout>
  );
}
