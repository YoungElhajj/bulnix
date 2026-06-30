import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Key, Eye, EyeOff, Code } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Link } from "wouter";

export default function ApiKeys() {
  const [label, setLabel] = useState("");
  const [showKey, setShowKey] = useState<Record<number, boolean>>({});
  const utils = trpc.useUtils();

  const { data: keys } = trpc.apiKeys.list.useQuery();

  const generateMutation = trpc.apiKeys.generate.useMutation({
    onSuccess: () => { utils.apiKeys.list.invalidate(); setLabel(""); toast.success("API key generated"); },
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
          <div className="flex gap-2">
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Key label (e.g. My Bot)" className="bg-slate-800 border-slate-600 text-white" />
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
              <div className="flex gap-2">
                <Input readOnly value={showKey[k.id] ? k.key : "•".repeat(40)}
                  className="bg-slate-900 border-slate-600 text-slate-300 font-mono text-xs" />
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white shrink-0"
                  onClick={() => setShowKey(s => ({ ...s, [k.id]: !s[k.id] }))}>
                  {showKey[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white shrink-0" onClick={() => copyKey(k.key)}>
                  <Copy className="w-4 h-4" />
                </Button>
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
    </div>
  );
}
