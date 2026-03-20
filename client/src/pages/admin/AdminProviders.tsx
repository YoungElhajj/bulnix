import { useState } from "react";
import { RefreshCw, Settings, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminProviders() {
  const { isAuthenticated, user } = useAuth();
  const [syncType, setSyncType] = useState<"categories"|"products"|"stock"|"prices"|"full">("full");
  const [syncing, setSyncing] = useState<string|null>(null);

  const utils = trpc.useUtils();
  const { data: providers, isLoading } = trpc.admin.providers.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const updateProvider = trpc.admin.providers.update.useMutation({ onSuccess: () => { toast.success("Provider updated"); utils.admin.providers.list.invalidate(); }, onError: e => toast.error(e.message) });
  const triggerSync = trpc.admin.providers.triggerSync.useMutation({
    onSuccess: (data) => { toast.success((data as any)?.message ?? "Sync triggered!"); setSyncing(null); utils.admin.providers.list.invalidate(); },
    onError: (e) => { toast.error(e.message); setSyncing(null); },
  });

  const handleSync = (providerKey: string) => {
    setSyncing(providerKey);
    triggerSync.mutate({ providerKey, syncType });
  };

  const providerList = (providers as any[]) ?? [];

  return (
    <AdminLayout title="Provider Settings">
      <div className="mb-6"><h1 className="text-2xl font-bold text-white">Provider Settings</h1><p className="text-slate-500 text-sm mt-0.5">Manage supplier API connections and sync settings</p></div>

      <div className="glass-card rounded-xl p-6 mb-6">
        <h3 className="text-base font-bold text-white mb-4">Trigger Sync</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={syncType} onValueChange={(v:any)=>setSyncType(v)}>
            <SelectTrigger className="w-[160px] bg-[#0F172A] border-white/10 text-white h-9"><SelectValue/></SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="full">Full Sync</SelectItem><SelectItem value="categories">Categories</SelectItem><SelectItem value="products">Products</SelectItem><SelectItem value="stock">Stock</SelectItem><SelectItem value="prices">Prices</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white h-9" onClick={()=>handleSync("accszone")} disabled={!!syncing}>
            {syncing === "accszone" ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <RefreshCw className="h-4 w-4 mr-2"/>}
            Sync AccsZone
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-3">Full sync fetches categories, products, stock, and prices. Individual syncs are faster for specific updates.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(2)].map((_,i)=><div key={i} className="glass-card rounded-xl p-6 h-40 animate-pulse"/>)}</div>
      ) : providerList.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center">
          <Settings className="h-12 w-12 text-slate-700 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-white mb-2">No providers configured</h3>
          <p className="text-slate-500 text-sm">Provider configurations will appear here once set up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providerList.map((provider: any) => (
            <div key={provider.providerKey} className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00B9E9]/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-[#00B9E9]"/>
                  </div>
                  <div>
                    <div className="font-bold text-white capitalize">{provider.providerKey}</div>
                    <div className="text-xs text-slate-500">Last sync: {provider.lastSyncAt ? new Date(provider.lastSyncAt).toLocaleString() : "Never"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={provider.isEnabled ? "bg-[#22C55E]/10 text-[#22C55E] border-0" : "bg-slate-500/10 text-slate-400 border-0"}>
                    {provider.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch checked={provider.isEnabled} onCheckedChange={v=>updateProvider.mutate({providerKey:provider.providerKey,isEnabled:v})}/>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 text-xs mb-1.5 block">API Key</Label>
                  <Input value={provider.apiKey ?? ""} onChange={e=>updateProvider.mutate({providerKey:provider.providerKey,apiKey:e.target.value})} placeholder="Enter API key..." type="password" className="bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-9 text-sm"/>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs mb-1.5 block">Default Markup %</Label>
                  <Input type="number" value={provider.defaultMarkupPercent ?? 20} onChange={e=>updateProvider.mutate({providerKey:provider.providerKey,defaultMarkupPercent:Number(e.target.value)})} className="bg-[#0F172A] border-white/10 text-white focus:border-[#00B9E9] h-9 text-sm"/>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
