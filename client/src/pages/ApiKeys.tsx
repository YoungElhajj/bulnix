import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Key, Code, AlertTriangle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Link } from "wouter";

export default function ApiKeys() {
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState<{ rawKey: string; label: string } | null>(null);
  const utils = trpc.useUtils();

  const { data: keys } = trpc.apiKeys.list.useQuery();

  const generateMutation = trpc.apiKeys.generate.useMutation({
    onSuccess: (data) => { utils.apiKeys.list.invalidate(); setLabel(""); setNewKey({ rawKey: data.rawKey, label: data.label }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => { utils.apiKeys.list.invalidate(); toast.success("API key deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.apiKeys.toggle.useMutation({
    onSuccess: () => utils.apiKeys.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  }

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <div className="container max-w-2xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold text-white">API Keys</h1>
            <p className="text-sm text-slate-400">Integrate Bulnix into your own platform</p>
          </div>
        </div>

        {/* Generate */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Generate New Key</h2>
          <p className="text-xs text-slate-400">You can create up to 3 API keys. The full key is shown <strong>only once</strong> after creation — copy it immediately.</p>
          <div className="flex gap-2">
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Key label (e.g. My Bot)"
              className="bg-slate-800 border-slate-600 text-white"
              onKeyDown={e => e.key === "Enter" && label.trim() && generateMutation.mutate({ label })}
            />
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black shrink-0" disabled={generateMutation.isPending || !label.trim()}
              onClick={() => generateMutation.mutate({ label })}>
              <Plus className="w-4 h-4 mr-1" /> Generate
            </Button>
          </div>
        </div>

        {/* Keys List */}
        <div className="space-y-3">
          {!keys || keys.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No API keys yet. Generate one above.
            </div>
          ) : keys.map((k: any) => (
            <div key={k.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{k.label}</span>
                  {k.isEnabled && k.adminEnabled ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>
                  ) : (
                    <Badge className="bg-slate-600/40 text-slate-400 text-xs">Disabled</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={k.isEnabled} onCheckedChange={v => toggleMutation.mutate({ id: k.id, isEnabled: v })} />
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                    onClick={() => { if (confirm("Delete this API key?")) deleteMutation.mutate({ id: k.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 font-mono text-xs text-slate-400 overflow-hidden">
                  <span className="text-cyan-400">{k.keyPrefix}</span>{"•".repeat(48)}
                </div>
              </div>
              <p className="text-xs text-slate-500">Created {new Date(k.createdAt).toLocaleDateString()} · Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</p>
            </div>
          ))}
        </div>

        {/* Docs Link */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
          <Code className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">API Documentation</p>
            <p className="text-xs text-slate-400">Learn how to use the Bulnix API to automate orders and fetch products</p>
          </div>
          <Link href="/api-docs">
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:text-white shrink-0">View Docs</Button>
          </Link>
        </div>
      </div>

      {/* One-time key display dialog */}
      <Dialog open={!!newKey} onOpenChange={(open) => { if (!open) setNewKey(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Key className="w-5 h-5 text-cyan-400" />
              API Key Created
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                <strong>Copy your key now.</strong> For security reasons, the full key is shown only once and cannot be retrieved later.
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Label: <span className="text-white">{newKey?.label}</span></p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={newKey?.rawKey ?? ""}
                  className="bg-slate-800 border-slate-600 text-cyan-300 font-mono text-xs"
                />
                <Button
                  size="sm"
                  className="bg-cyan-500 hover:bg-cyan-600 text-black shrink-0"
                  onClick={() => { navigator.clipboard.writeText(newKey?.rawKey ?? ""); toast.success("Copied!"); }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              onClick={() => setNewKey(null)}
            >
              I've saved my key — Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
