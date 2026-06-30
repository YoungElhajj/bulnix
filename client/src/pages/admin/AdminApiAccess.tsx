import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Key, Search, User } from "lucide-react";

export default function AdminApiAccess() {
  const [search, setSearch] = useState("");

  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.adminList.useQuery();

  const toggleMutation = trpc.apiKeys.adminToggle.useMutation({
    onSuccess: () => { refetch(); toast.success("API key access updated"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (apiKeys ?? []).filter((k: any) => {
    const q = search.toLowerCase();
    return !q || (k.userName?.toLowerCase().includes(q) || k.userEmail?.toLowerCase().includes(q) || k.label?.toLowerCase().includes(q));
  });

  // Group by user
  const byUser: Record<number, { userName: string; userEmail: string; keys: any[] }> = {};
  for (const k of filtered) {
    if (!byUser[k.userId]) byUser[k.userId] = { userName: k.userName ?? "Unknown", userEmail: k.userEmail ?? "", keys: [] };
    byUser[k.userId].keys.push(k);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">API Access Control</h1>
          <p className="text-slate-400 text-sm mt-1">Enable or disable API keys for users. Disabling a key prevents it from being used even if the user has it enabled.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Total Keys</p>
            <p className="text-2xl font-bold text-white mt-1">{apiKeys?.length ?? 0}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Active Keys</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{apiKeys?.filter((k: any) => k.isEnabled && k.adminEnabled).length ?? 0}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Disabled by Admin</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{apiKeys?.filter((k: any) => !k.adminEnabled).length ?? 0}</p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Unique Users</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{Object.keys(byUser).length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by user or key label..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white"
          />
        </div>

        {/* Keys by User */}
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 text-sm">Loading...</div>
        ) : Object.keys(byUser).length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No API keys found.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byUser).map(([userId, { userName, userEmail, keys }]) => (
              <div key={userId} className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
                {/* User header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-800/40">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                  </div>
                  <Badge className="bg-slate-700 text-slate-300 text-xs">{keys.length} key{keys.length !== 1 ? "s" : ""}</Badge>
                </div>
                {/* Keys */}
                <div className="divide-y divide-slate-700/50">
                  {keys.map((k: any) => (
                    <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-white font-medium">{k.label}</span>
                          {k.isEnabled && k.adminEnabled ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>
                          ) : !k.adminEnabled ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Admin Disabled</Badge>
                          ) : (
                            <Badge className="bg-slate-600/40 text-slate-400 text-xs">User Disabled</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 font-mono">{k.keyPrefix}{"•".repeat(20)}</span>
                          <span className="text-xs text-slate-500">{k.requestCount ?? 0} requests</span>
                          <span className="text-xs text-slate-500">
                            Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-400">Admin allow:</span>
                        <Switch
                          checked={k.adminEnabled}
                          onCheckedChange={v => toggleMutation.mutate({ id: k.id, adminEnabled: v })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
