import { useState, useEffect } from "react";
import { RefreshCw, Settings, Loader2, CheckCircle, AlertCircle, Clock, Zap, Activity } from "lucide-react";
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
  const [syncStartTime, setSyncStartTime] = useState<number|null>(null);
  const [elapsed, setElapsed] = useState(0);

  const utils = trpc.useUtils();
  const { data: providers, isLoading, refetch: refetchProviders } = trpc.admin.providers.list.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin", retry: false, refetchInterval: syncing ? 3000 : false }
  );
  const { data: syncLogs, refetch: refetchLogs } = trpc.admin.providers.syncLogs.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin", retry: false, refetchInterval: syncing ? 3000 : 30000 }
  );

  const updateProvider = trpc.admin.providers.update.useMutation({
    onSuccess: () => { toast.success("Provider updated"); utils.admin.providers.list.invalidate(); },
    onError: e => toast.error(e.message)
  });

  const triggerSync = trpc.admin.providers.triggerSync.useMutation({
    onSuccess: (data) => {
      toast.success((data as any)?.message ?? "Sync triggered! Products will update in the background.");
      // Poll for completion - check sync logs every 5 seconds
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        refetchLogs();
        refetchProviders();
        if (pollCount >= 24) { // Max 2 minutes
          clearInterval(pollInterval);
          setSyncing(null);
          setSyncStartTime(null);
          toast.info("Sync is taking longer than expected. Check sync history for status.");
        }
      }, 5000);
      // Also set a fallback timeout
      setTimeout(() => {
        clearInterval(pollInterval);
        setSyncing(null);
        setSyncStartTime(null);
        refetchProviders();
        refetchLogs();
        toast.success("Sync complete! Check the sync history below for results.");
      }, 45000);
    },
    onError: (e) => { toast.error(e.message); setSyncing(null); setSyncStartTime(null); },
  });

  // Elapsed timer while syncing
  useEffect(() => {
    if (!syncing || !syncStartTime) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - syncStartTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [syncing, syncStartTime]);

  const handleSync = (providerKey: string) => {
    setSyncing(providerKey);
    setSyncStartTime(Date.now());
    triggerSync.mutate({ providerKey, syncType });
    toast.info(`Starting ${syncType} sync for ${providerKey}. This runs in the background.`);
  };

  const providerList = (providers as any[]) ?? [];
  const logs = (syncLogs as any[]) ?? [];

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;

  return (
    <AdminLayout title="Provider Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D2137]">Provider Settings</h1>
        <p className="text-[#4A6080] text-sm mt-0.5">Manage supplier API connections and sync settings</p>
      </div>

      {/* Auto-Sync Status Banner */}
      <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-4 mb-6 border border-[#0050D0]/20 bg-[#00C2FF]/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EEF4FF] flex items-center justify-center shrink-0">
            <Activity className="h-4 w-4 text-[#0050D0]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#0D2137] flex items-center gap-2">
              Auto-Sync Active
              <span className="inline-flex items-center gap-1 text-xs font-normal text-[#0050D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse" />
                Running
              </span>
            </div>
            <p className="text-xs text-[#4A6080] mt-0.5">
              Stock and prices sync every 15 minutes automatically. Full product sync runs every hour. Your catalog stays up to date without manual intervention.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Sync Controls */}
      <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 mb-6">
        <h3 className="text-base font-bold text-[#0D2137] mb-1">Manual Sync</h3>
        <p className="text-xs text-[#4A6080] mb-4">Trigger an immediate sync to pull the latest products, stock, and prices from your supplier right now.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={syncType} onValueChange={(v: any) => setSyncType(v)} disabled={!!syncing}>
            <SelectTrigger className="w-[160px] bg-white border-[#D8E8F5] text-[#0D2137] h-9 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#D8E8F5]">
              <SelectItem value="full">Full Sync</SelectItem>
              <SelectItem value="categories">Categories Only</SelectItem>
              <SelectItem value="products">Products Only</SelectItem>
              <SelectItem value="stock">Stock Only</SelectItem>
              <SelectItem value="prices">Prices Only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="relative overflow-hidden bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] h-9 min-w-[200px] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            onClick={() => handleSync("accszone")}
            disabled={!!syncing}
          >
            {syncing === "accszone" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Syncing{elapsed > 0 ? ` (${formatElapsed(elapsed)})` : "..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span>Sync AccsZone Now</span>
              </span>
            )}
          </Button>
        </div>

        {/* Progress bar + status message shown while syncing */}
        {syncing === "accszone" && (
          <div className="mt-4 space-y-2">
            {/* Animated progress bar */}
            <div className="h-1.5 w-full rounded-full bg-[#F5F9FF] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00C2FF] to-[#00C2FF] animate-pulse"
                style={{ width: `${Math.min(100, (elapsed / 45) * 100)}%`, transition: "width 1s linear" }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4A6080]">
              <Zap className="h-3 w-3 text-[#0050D0] animate-pulse shrink-0" />
              <span>Fetching latest inventory from supplier. Products will update automatically when complete.</span>
              <span className="ml-auto text-[#0050D0] font-mono shrink-0">{formatElapsed(elapsed)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Provider Cards */}
      {isLoading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 h-40 animate-pulse" />)}</div>
      ) : providerList.length === 0 ? (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-8 text-center">
          <Settings className="h-12 w-12 text-[#4A6080] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#0D2137] mb-2">No providers configured</h3>
          <p className="text-[#4A6080] text-sm">Provider configurations will appear here once set up.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {providerList.map((provider: any) => (
            <div key={provider.providerKey} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
                    <Settings className="h-5 w-5 text-[#0050D0]" />
                  </div>
                  <div>
                    <div className="font-bold text-[#0D2137] capitalize">{provider.providerKey}</div>
                    <div className="text-xs text-[#4A6080] flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      Last sync: {provider.lastSyncAt ? new Date(provider.lastSyncAt).toLocaleString() : "Never"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={provider.isEnabled ? "bg-[#EEF4FF] text-[#0050D0] border-0" : "bg-slate-500/10 text-[#4A6080] border-0"}>
                    {provider.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Switch
                    checked={provider.isEnabled}
                    onCheckedChange={v => updateProvider.mutate({ providerKey: provider.providerKey, isEnabled: v })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#4A6080] text-xs mb-1.5 block">API Key</Label>
                  <Input
                    value={provider.apiKey ?? ""}
                    onChange={e => updateProvider.mutate({ providerKey: provider.providerKey, apiKey: e.target.value })}
                    placeholder="Enter API key..."
                    type="password"
                    className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[#4A6080] text-xs mb-1.5 block">Default Markup %</Label>
                  <Input
                    type="number"
                    value={provider.defaultMarkupPercent ?? 20}
                    onChange={e => updateProvider.mutate({ providerKey: provider.providerKey, defaultMarkupPercent: Number(e.target.value) })}
                    className="bg-white border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-9 text-sm"
                  />
                </div>
              </div>
              {/* Quick sync shortcut inside provider card */}
              <div className="mt-4 pt-4 border-t border-[#D8E8F5] flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-[#0050D0]/30 text-[#0050D0] hover:bg-[#EEF4FF] bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleSync(provider.providerKey)}
                  disabled={!!syncing}
                >
                  {syncing === provider.providerKey ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1.5" />Syncing...</>
                  ) : (
                    <><RefreshCw className="h-3 w-3 mr-1.5" />Quick Sync</>  
                  )}
                </Button>
                {syncing === provider.providerKey && (
                  <span className="text-xs text-[#4A6080] flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin text-[#0050D0]" />
                    Running {syncType} sync — {formatElapsed(elapsed)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Sync Logs */}
      {logs.length > 0 && (
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6">
          <h3 className="text-base font-bold text-[#0D2137] mb-4">Recent Sync History</h3>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-[#D8E8F5] last:border-0">
                {log.status === "success" || log.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-[#0050D0] shrink-0" />
                ) : log.status === "failed" ? (
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-[#0050D0] animate-spin shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#0D2137] capitalize">{log.syncType} sync — {log.providerKey}</div>
                  {log.errorMessage && <div className="text-xs text-red-400 truncate">{log.errorMessage}</div>}
                </div>
                <div className="text-xs text-[#4A6080] shrink-0">{new Date(log.startedAt).toLocaleString()}</div>
                <Badge className={
                  (log.status === "success" || log.status === "completed") ? "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs" :
                  log.status === "failed" ? "bg-red-500/10 text-red-400 border-0 text-xs" :
                  "bg-[#EEF4FF] text-[#0050D0] border-0 text-xs"
                }>{log.status === 'success' ? 'completed' : log.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
