import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Key, Upload, Eye, EyeOff, Package, RefreshCw } from "lucide-react";

type ManualProduct = {
  id: number; title: string; slug: string; customerPriceUSD: string;
  stockQuantity: number; isVisible: boolean; isFeatured: boolean;
  isSubscription: boolean; categoryId: number | null; imageUrl: string | null;
  description: string | null; shortDescription: string | null; deliveryNote: string | null;
};

export default function AdminManualProducts() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ManualProduct | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCredDialog, setShowCredDialog] = useState(false);
  const [showDeliverDialog, setShowDeliverDialog] = useState<{ orderId: number; orderNumber: string } | null>(null);
  const [credText, setCredText] = useState("");
  const [deliveryText, setDeliveryText] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", shortDescription: "", categoryId: "",
    customerPriceUSD: "", imageUrl: "", isSubscription: false, deliveryNote: "", isVisible: true,
  });

  const { data: productsData, isLoading } = trpc.admin.products.list.useQuery(
    { page, limit: 50, search: search || undefined },
    { staleTime: 30_000 }
  );
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: credentials, refetch: refetchCreds } = trpc.manualProducts.getCredentials.useQuery(
    { productId: selectedProduct?.id ?? 0, includeUsed: true },
    { enabled: !!selectedProduct && showCredDialog }
  );

  const createMutation = trpc.manualProducts.create.useMutation({
    onSuccess: () => { utils.admin.products.list.invalidate(); setShowCreateDialog(false); toast.success("Product created"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.manualProducts.update.useMutation({
    onSuccess: () => { utils.admin.products.list.invalidate(); setShowEditDialog(false); toast.success("Product updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.manualProducts.delete.useMutation({
    onSuccess: () => { utils.admin.products.list.invalidate(); toast.success("Product deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const addCredsMutation = trpc.manualProducts.addCredentials.useMutation({
    onSuccess: (r) => { refetchCreds(); utils.admin.products.list.invalidate(); setCredText(""); toast.success(`${r.added} credentials added`); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCredMutation = trpc.manualProducts.deleteCredential.useMutation({
    onSuccess: () => { refetchCreds(); utils.admin.products.list.invalidate(); toast.success("Credential deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const deliverMutation = trpc.manualProducts.deliverSubscription.useMutation({
    onSuccess: () => { setShowDeliverDialog(null); setDeliveryText(""); toast.success("Subscription delivered and customer notified"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ title: "", description: "", shortDescription: "", categoryId: "", customerPriceUSD: "", imageUrl: "", isSubscription: false, deliveryNote: "", isVisible: true });
  }

  function openEdit(p: ManualProduct) {
    setSelectedProduct(p);
    setForm({
      title: p.title, description: p.description ?? "", shortDescription: p.shortDescription ?? "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      customerPriceUSD: p.customerPriceUSD, imageUrl: p.imageUrl ?? "",
      isSubscription: p.isSubscription, deliveryNote: p.deliveryNote ?? "", isVisible: p.isVisible,
    });
    setShowEditDialog(true);
  }

  const manualProducts = (productsData?.items ?? []).filter((p: any) => p.isManual);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Manual Products</h1>
          <p className="text-sm text-slate-400 mt-0.5">Products you stock and deliver yourself</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="bg-cyan-500 hover:bg-cyan-600 text-black">
          <Plus className="w-4 h-4 mr-2" /> New Product
        </Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs bg-slate-800 border-slate-700 text-white" />
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : manualProducts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No manual products yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {manualProducts.map((p: any) => (
            <div key={p.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm truncate">{p.title}</span>
                  {p.isSubscription && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">Subscription</Badge>}
                  {p.isVisible ? <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">Visible</Badge> : <Badge className="bg-slate-600/40 text-slate-400 text-xs">Hidden</Badge>}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span className="text-cyan-400 font-semibold">${Number(p.customerPriceUSD).toFixed(2)}</span>
                  <span>{p.stockQuantity} in stock</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:text-white text-xs" onClick={() => { setSelectedProduct(p); setShowCredDialog(true); }}>
                  <Key className="w-3 h-3 mr-1" /> Credentials ({p.stockQuantity})
                </Button>
                <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:text-white text-xs" onClick={() => openEdit(p)}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" className="border-red-900/50 text-red-400 hover:text-red-300 text-xs" onClick={() => { if (confirm("Delete this product and all its credentials?")) deleteMutation.mutate({ id: p.id }); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Manual Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="e.g. Netflix Premium 1 Month" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Price (USD) *</Label>
              <Input type="number" step="0.01" value={form.customerPriceUSD} onChange={e => setForm(f => ({ ...f, customerPriceUSD: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" placeholder="9.99" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{categories?.map((c: any) => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Short Description</Label>
              <Input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Full Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" rows={3} /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Delivery Note (shown to buyer)</Label>
              <Textarea value={form.deliveryNote} onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" rows={2} /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Image URL</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isSubscription} onCheckedChange={v => setForm(f => ({ ...f, isSubscription: v }))} />
              <Label className="text-slate-300 text-sm">Subscription product (admin delivers manually)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isVisible} onCheckedChange={v => setForm(f => ({ ...f, isVisible: v }))} />
              <Label className="text-slate-300 text-sm">Visible to customers</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-slate-400">Cancel</Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black" disabled={createMutation.isPending} onClick={() => createMutation.mutate({
              title: form.title, description: form.description || undefined, shortDescription: form.shortDescription || undefined,
              categoryId: form.categoryId ? Number(form.categoryId) : undefined,
              customerPriceUSD: Number(form.customerPriceUSD), imageUrl: form.imageUrl || undefined,
              isSubscription: form.isSubscription, deliveryNote: form.deliveryNote || undefined, isVisible: form.isVisible,
            })}>
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Price (USD)</Label>
              <Input type="number" step="0.01" value={form.customerPriceUSD} onChange={e => setForm(f => ({ ...f, customerPriceUSD: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Category</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">{categories?.map((c: any) => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Short Description</Label>
              <Input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Full Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" rows={3} /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Delivery Note</Label>
              <Textarea value={form.deliveryNote} onChange={e => setForm(f => ({ ...f, deliveryNote: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" rows={2} /></div>
            <div><Label className="text-slate-300 text-xs mb-1.5 block">Image URL</Label>
              <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="bg-slate-800 border-slate-600 text-white" /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isSubscription} onCheckedChange={v => setForm(f => ({ ...f, isSubscription: v }))} />
              <Label className="text-slate-300 text-sm">Subscription product</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isVisible} onCheckedChange={v => setForm(f => ({ ...f, isVisible: v }))} />
              <Label className="text-slate-300 text-sm">Visible to customers</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="text-slate-400">Cancel</Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black" disabled={updateMutation.isPending} onClick={() => selectedProduct && updateMutation.mutate({
              id: selectedProduct.id, title: form.title, description: form.description || undefined,
              shortDescription: form.shortDescription || undefined,
              categoryId: form.categoryId ? Number(form.categoryId) : null,
              customerPriceUSD: Number(form.customerPriceUSD), imageUrl: form.imageUrl || undefined,
              isSubscription: form.isSubscription, deliveryNote: form.deliveryNote || undefined, isVisible: form.isVisible,
            })}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredDialog} onOpenChange={setShowCredDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credentials — {selectedProduct?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1.5 block">Add Credentials (one per line)</Label>
              <Textarea value={credText} onChange={e => setCredText(e.target.value)} className="bg-slate-800 border-slate-600 text-white font-mono text-xs" rows={6}
                placeholder={"username:password:email\nusername2:password2:email2\n..."} />
              <p className="text-xs text-slate-500 mt-1">Each line = one credential. Format: any text you want (e.g. user:pass or JSON).</p>
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black w-full" disabled={addCredsMutation.isPending || !credText.trim()}
              onClick={() => selectedProduct && addCredsMutation.mutate({ productId: selectedProduct.id, lines: credText.split("\n").filter(l => l.trim()) })}>
              <Upload className="w-4 h-4 mr-2" /> {addCredsMutation.isPending ? "Adding..." : "Add Credentials"}
            </Button>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Existing Credentials ({credentials?.length ?? 0})</h3>
                <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => refetchCreds()}><RefreshCw className="w-3 h-3" /></Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {credentials?.map((c: any) => (
                  <div key={c.id} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-mono ${c.isUsed ? "bg-slate-800/40 opacity-50" : "bg-slate-800"}`}>
                    <span className="flex-1 truncate text-slate-300">{c.data}</span>
                    {c.isUsed ? <Badge className="bg-green-500/20 text-green-400 text-xs shrink-0">Used</Badge> : (
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-6 w-6 p-0 shrink-0"
                        onClick={() => deleteCredMutation.mutate({ id: c.id })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {(!credentials || credentials.length === 0) && <p className="text-slate-500 text-xs text-center py-4">No credentials yet</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliver Subscription Dialog */}
      {showDeliverDialog && (
        <Dialog open={!!showDeliverDialog} onOpenChange={() => setShowDeliverDialog(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader><DialogTitle>Deliver Subscription — Order #{showDeliverDialog.orderNumber}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <Label className="text-slate-300 text-xs mb-1.5 block">Delivery Data (credentials/details to send to customer)</Label>
              <Textarea value={deliveryText} onChange={e => setDeliveryText(e.target.value)} className="bg-slate-800 border-slate-600 text-white font-mono text-xs" rows={6}
                placeholder="Username: ...\nPassword: ...\nExpiry: ..." />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDeliverDialog(null)} className="text-slate-400">Cancel</Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black" disabled={deliverMutation.isPending || !deliveryText.trim()}
                onClick={() => deliverMutation.mutate({ orderId: showDeliverDialog.orderId, deliveryData: deliveryText })}>
                {deliverMutation.isPending ? "Delivering..." : "Deliver & Notify Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
