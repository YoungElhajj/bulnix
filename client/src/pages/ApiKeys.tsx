import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Key, Plus, Trash2, Clock, CheckCircle2, XCircle, BookOpen, AlertCircle, Code, Copy, Eye, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";

export default function ApiKeys() {
  const [label, setLabel] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [acknowledgedKeys, setAcknowledgedKeys] = useState<Set<number>>(new Set());
  const utils = trpc.useUtils();
  const { data: keys } = trpc.apiKeys.list.useQuery();

  const requestMutation = trpc.apiKeys.request.useMutation({
    onSuccess: () => {
      toast.success("API key request submitted! You will be notified once approved.");
      setLabel("");
      setShowForm(false);
      utils.apiKeys.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => { toast.success("API key deleted"); utils.apiKeys.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const clearRawKeyMutation = trpc.apiKeys.clearRawKeyOnce.useMutation({
    onSuccess: () => utils.apiKeys.list.invalidate(),
  });

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard!");
  }

  function acknowledgeKey(id: number) {
    setAcknowledgedKeys(prev => { const s = new Set(prev); s.add(id); return s; });
    clearRawKeyMutation.mutate({ id });
  }

  const hasPendingRequest = keys?.some((k: any) => k.status === "pending");

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <SEO
        title="API Keys | Bulnix"
        description="Manage your Bulnix API keys. Request access and integrate Bulnix into your applications."
        canonical="https://bulnix.com/api-keys"
      />
      <Navbar />
      <div className="container max-w-3xl py-8 space-y-8 pt-28">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs text-cyan-400 font-medium mb-3">
              <Key className="w-3.5 h-3.5" /> API Access
            </div>
            <h1 className="text-3xl font-extrabold text-white">API Keys</h1>
            <p className="text-slate-400 text-sm mt-1">Integrate Bulnix into your applications with our REST API.</p>
          </div>
          <Link href="/api-docs">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white gap-2 shrink-0 bg-transparent">
              <BookOpen className="w-4 h-4" /> API Docs
            </Button>
          </Link>
        </div>

        {/* How it works */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" /> How API Access Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Request a Key", desc: "Submit a request with a label describing your use case.", icon: <Plus className="w-4 h-4 text-cyan-400" /> },
              { title: "Admin Review", desc: "Our team reviews your request within 24 hours.", icon: <Clock className="w-4 h-4 text-yellow-400" /> },
              { title: "Start Building", desc: "Once approved, use your key to access the Bulnix API.", icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0">{s.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending notice */}
        {hasPendingRequest && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-300">Request Pending Review</p>
              <p className="text-sm text-yellow-400/80 mt-0.5">Your API key request is being reviewed. You will receive a notification once it is approved or rejected.</p>
            </div>
          </div>
        )}

        {/* Request new key */}
        {!hasPendingRequest && (
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-white">Request an API Key</h2>
            {showForm ? (
              <div className="space-y-3">
                <Input
                  placeholder="Label (e.g. My App, Bot, Integration)"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="bg-slate-900 border-slate-600 text-white"
                  maxLength={64}
                  onKeyDown={e => e.key === "Enter" && label.trim() && requestMutation.mutate({ label: label.trim() })}
                />
                <div className="flex gap-2">
                  <Button
                    className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    disabled={!label.trim() || requestMutation.isPending}
                    onClick={() => requestMutation.mutate({ label: label.trim() })}
                  >
                    {requestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button variant="outline" className="border-slate-600 text-slate-400 bg-transparent" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
<<<<<<< Updated upstream
            ) : (
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-2"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4" /> Request API Key
              </Button>
            )}
          </div>
        )}

        {/* Keys list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white">Your API Keys</h2>
          {!keys || keys.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No API keys yet.</p>
              <p className="text-xs mt-1">Request your first key above to get started.</p>
=======
              {/* Show rawKeyOnce if available (one-time after admin approval) */}
              {k.rawKeyOnce ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300"><strong>Your API key is ready.</strong> Copy it now. It will not be shown again after you acknowledge.</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-xs text-amber-300 overflow-x-auto whitespace-nowrap">{k.rawKeyOnce}</div>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:text-white shrink-0" onClick={() => copyKey(k.rawKeyOnce)}><Copy className="w-3.5 h-3.5" /></Button>
                  </div>
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => { navigator.clipboard.writeText(k.rawKeyOnce); utils.apiKeys.list.invalidate(); toast.success("Key copied and acknowledged!"); }}>I have saved my key</Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 font-mono text-xs text-slate-400 overflow-hidden">
                    <span className="text-cyan-400">{k.keyPrefix}</span>{"•".repeat(48)}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">Created {new Date(k.createdAt).toLocaleDateString()} · Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</p>
>>>>>>> Stashed changes
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k: any) => (
                <div key={k.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        k.status === "active" ? "bg-green-500/20" :
                        k.status === "pending" ? "bg-yellow-500/20" : "bg-red-500/20"
                      }`}>
                        {k.status === "active" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                         k.status === "pending" ? <Clock className="w-4 h-4 text-yellow-400" /> :
                         <XCircle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{k.label}</p>
                        {k.status === "active" && k.rawKeyOnce && !acknowledgedKeys.has(k.id) && (
                          <div className="mt-2 space-y-2">
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                              <p className="text-xs text-green-300 font-semibold mb-1 flex items-center gap-1"><Eye className="w-3 h-3" /> Your full API key (shown once — copy it now!):</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs text-cyan-300 font-mono bg-slate-900 px-2 py-1 rounded flex-1 break-all">{k.rawKeyOnce}</code>
                                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black h-7 px-2 shrink-0" onClick={() => copyKey(k.rawKeyOnce)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white text-xs mt-2 h-6" onClick={() => acknowledgeKey(k.id)}>
                                I have saved my key, hide it
                              </Button>
                            </div>
                          </div>
                        )}
                        {k.status === "active" && k.keyPrefix && (acknowledgedKeys.has(k.id) || !k.rawKeyOnce) && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{k.keyPrefix}••••••••••••••••••••••••••••••••••••••••</p>
                        )}
                        {k.status === "pending" && (
                          <p className="text-xs text-yellow-400/80 mt-0.5">Awaiting admin approval</p>
                        )}
                        {k.status === "rejected" && (
                          <p className="text-xs text-red-400/80 mt-0.5">Rejected{k.adminNote ? `: ${k.adminNote}` : ""}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-xs ${
                        k.status === "active" ? "border-green-500/30 text-green-400" :
                        k.status === "pending" ? "border-yellow-500/30 text-yellow-400" :
                        "border-red-500/30 text-red-400"
                      }`}>
                        {k.status}
                      </Badge>
                      {k.status !== "pending" && (
                        <Button
                          size="sm" variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                          onClick={() => { if (confirm("Delete this API key?")) deleteMutation.mutate({ id: k.id }); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {k.status === "active" && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                      <span>Requests: {k.requestCount?.toLocaleString() ?? 0}</span>
                      <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                      {k.lastUsedAt && <span>Last used: {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Docs CTA */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">Ready to integrate?</p>
            <p className="text-sm text-slate-400 mt-0.5">Read our API documentation to learn how to use your key.</p>
          </div>
          <Link href="/api-docs">
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-2 shrink-0">
              <Code className="w-4 h-4" /> View Docs
            </Button>
          </Link>
        </div>

<<<<<<< Updated upstream
      </div>
=======
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
              I have saved my key. Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
>>>>>>> Stashed changes
    </div>
  );
}
