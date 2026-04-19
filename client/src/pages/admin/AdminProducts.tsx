import { useState } from "react";
import { Package, Search, Edit, Eye, EyeOff, Star, Save, Loader2, Plus, X, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminProducts() {
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "", slug: "", description: "", imageUrl: "",
    categoryId: "", supplierPrice: "", markupPercent: "20",
    stockQuantity: "0", stockUnlimited: false,
    deliveryNote: "", isVisible: true, isFeatured: false,
  });

  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, onSuccess: (url: string) => void) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onSuccess(data.url);
      toast.success("Image uploaded!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.products.list.useQuery(
    { page, limit: 50, search: search || undefined },
    { enabled: isAuthenticated && user?.role === "admin", retry: false }
  );
  const { data: categoriesData } = trpc.admin.categories.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin", retry: false
  });

  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => { toast.success("Product updated!"); setEditing(null); utils.admin.products.list.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const addProduct = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product added!");
      setAddOpen(false);
      setAddForm({ title: "", slug: "", description: "", imageUrl: "", categoryId: "", supplierPrice: "", markupPercent: "20", stockQuantity: "0", stockUnlimited: false, deliveryNote: "", isVisible: true, isFeatured: false });
      utils.admin.products.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const products = (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;
  const categories = (categoriesData as any[]) ?? [];

  const openEdit = (p: any) => {
    setEditing(p);
    setEditForm({
      title: p.title ?? "",
      description: p.description ?? "",
      imageUrl: p.imageUrl ?? "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      markupPercent: p.markupPercent ?? 20,
      deliveryNote: p.deliveryNote ?? "",
      refundPolicy: p.refundPolicy ?? "",
      isVisible: !!p.isVisible,
      isFeatured: !!p.isFeatured,
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    updateProduct.mutate({
      id: editing.id,
      title: editForm.title || undefined,
      description: editForm.description || undefined,
      imageUrl: editForm.imageUrl || undefined,
      categoryId: editForm.categoryId ? Number(editForm.categoryId) : undefined,
      markupPercent: Number(editForm.markupPercent),
      deliveryNote: editForm.deliveryNote || undefined,
      refundPolicy: editForm.refundPolicy || undefined,
      isVisible: editForm.isVisible,
      isFeatured: editForm.isFeatured,
    });
  };

  const handleAdd = () => {
    if (!addForm.title || !addForm.slug || !addForm.supplierPrice) {
      toast.error("Title, slug, and supplier price are required");
      return;
    }
    addProduct.mutate({
      title: addForm.title,
      slug: addForm.slug,
      description: addForm.description || undefined,
      imageUrl: addForm.imageUrl || undefined,
      categoryId: addForm.categoryId ? Number(addForm.categoryId) : undefined,
      supplierPrice: Number(addForm.supplierPrice),
      markupPercent: Number(addForm.markupPercent),
      stockQuantity: Number(addForm.stockQuantity),
      stockUnlimited: addForm.stockUnlimited,
      deliveryNote: addForm.deliveryNote || undefined,
      isVisible: addForm.isVisible,
      isFeatured: addForm.isFeatured,
    });
  };

  return (
    <AdminLayout title="Products">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="pl-9 bg-[#0A2540] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-9" />
          </div>
          <Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white h-9" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="glass-card rounded-xl h-14 animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Package className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No products found. Trigger a sync from the Providers page.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0F3D5E] text-slate-500 text-xs uppercase">
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4 hidden md:table-cell">Category</th>
                  <th className="text-right p-4">Base</th>
                  <th className="text-right p-4">Markup</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-center p-4">Stock</th>
                  <th className="text-center p-4">Visible</th>
                  <th className="text-center p-4">Featured</th>
                  <th className="text-center p-4">Edit</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#0A2540] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                            : <Package className="h-4 w-4 text-slate-600" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate max-w-[200px]">{p.title}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge className="bg-[#00C2FF]/10 text-[#00C2FF] border-0 text-xs">{p.providerKey ?? "manual"}</Badge>
                    </td>
                    <td className="p-4 text-right text-slate-300">${Number(p.supplierPrice ?? 0).toFixed(2)}</td>
                    <td className="p-4 text-right text-slate-300">{p.markupPercent ?? 20}%</td>
                    <td className="p-4 text-right font-semibold text-[#00C2FF]">${Number(p.customerPriceUSD ?? 0).toFixed(2)}</td>
                    <td className="p-4 text-center text-slate-300">{p.stockUnlimited ? "∞" : p.stockQuantity}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => updateProduct.mutate({ id: p.id, isVisible: !p.isVisible })} className={"w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors " + (p.isVisible ? "bg-[#00C2FF]/10 text-[#00C2FF] hover:bg-[#00C2FF]/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20")}>
                        {p.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => updateProduct.mutate({ id: p.id, isFeatured: !p.isFeatured })} className={"w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors " + (p.isFeatured ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20")}>
                        <Star className={"h-4 w-4 " + (p.isFeatured ? "fill-yellow-400" : "")} />
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-lg bg-[#00C2FF]/10 text-[#00C2FF] hover:bg-[#00C2FF]/20 flex items-center justify-center mx-auto transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 50 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-[#0F3D5E]">
              <Button variant="outline" className="border-[#0F3D5E] text-slate-400 hover:text-white hover:bg-[#0F3D5E]/30 h-8 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-slate-500 text-xs px-3">Page {page} of {Math.ceil(total / 50)}</span>
              <Button variant="outline" className="border-[#0F3D5E] text-slate-400 hover:text-white hover:bg-[#0F3D5E]/30 h-8 text-xs" disabled={products.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}>
        <DialogContent className="bg-[#0A2540] border-[#0F3D5E] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">Edit Product</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Title Override</Label>
                <Input value={editForm.title} onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))} className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Description Override</Label>
                <Textarea value={editForm.description} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] resize-none" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Product Icon / Logo</Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input value={editForm.imageUrl} onChange={e => setEditForm((f: any) => ({ ...f, imageUrl: e.target.value }))} placeholder="Paste URL or upload file below" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 hover:border-[#00C2FF]/50 cursor-pointer transition-colors bg-[#061A2B] text-xs text-slate-400 hover:text-[#00C2FF]">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploading ? "Uploading..." : "Upload image file (PNG, JPG, SVG, max 5MB)"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setEditForm((fm: any) => ({ ...fm, imageUrl: url }))); }} />
                    </label>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#061A2B] border border-[#0F3D5E] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {editForm.imageUrl
                      ? <img src={editForm.imageUrl} alt="preview" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <Image className="h-6 w-6 text-slate-700" />}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Category</Label>
                <Select value={editForm.categoryId || "none"} onValueChange={v => setEditForm((f: any) => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A2540] border-[#0F3D5E] text-white max-h-48">
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.parentId ? "  └ " : ""}{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Markup % (applied to supplier price)</Label>
                <Input type="number" value={editForm.markupPercent} onChange={e => setEditForm((f: any) => ({ ...f, markupPercent: Number(e.target.value) }))} className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Delivery Note</Label>
                <Input value={editForm.deliveryNote} onChange={e => setEditForm((f: any) => ({ ...f, deliveryNote: e.target.value }))} placeholder="e.g. Delivered within 5 minutes" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Refund Policy</Label>
                <Input value={editForm.refundPolicy} onChange={e => setEditForm((f: any) => ({ ...f, refundPolicy: e.target.value }))} placeholder="e.g. No refunds on digital goods" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="text-sm text-white">Visible to customers</div>
                <Switch checked={editForm.isVisible} onCheckedChange={v => setEditForm((f: any) => ({ ...f, isVisible: v }))} />
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="text-sm text-white">Featured product</div>
                <Switch checked={editForm.isFeatured} onCheckedChange={v => setEditForm((f: any) => ({ ...f, isFeatured: v }))} />
              </div>
              <Button className="w-full bg-[#00C2FF] hover:bg-[#00a8d4] text-white" onClick={handleUpdate} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A2540] border-[#0F3D5E] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Title *</Label>
              <Input value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80) }))} placeholder="Product title" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Slug *</Label>
              <Input value={addForm.slug} onChange={e => setAddForm(f => ({ ...f, slug: e.target.value }))} placeholder="product-slug" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Description</Label>
              <Textarea value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Product description..." className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] resize-none" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Product Icon / Logo</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input value={addForm.imageUrl} onChange={e => setAddForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Paste URL or upload file below" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/20 hover:border-[#00C2FF]/50 cursor-pointer transition-colors bg-[#061A2B] text-xs text-slate-400 hover:text-[#00C2FF]">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Uploading..." : "Upload image file (PNG, JPG, SVG, max 5MB)"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setAddForm(fm => ({ ...fm, imageUrl: url }))); }} />
                  </label>
                </div>
                <div className="w-16 h-16 rounded-xl bg-[#061A2B] border border-[#0F3D5E] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {addForm.imageUrl
                    ? <img src={addForm.imageUrl} alt="preview" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <Image className="h-6 w-6 text-slate-700" />}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Category</Label>
              <Select value={addForm.categoryId || "none"} onValueChange={v => setAddForm(f => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                <SelectTrigger className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A2540] border-[#0F3D5E] text-white max-h-48">
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.parentId ? "  └ " : ""}{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Supplier Price (USD) *</Label>
                <Input type="number" step="0.01" value={addForm.supplierPrice} onChange={e => setAddForm(f => ({ ...f, supplierPrice: e.target.value }))} placeholder="0.00" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Markup %</Label>
                <Input type="number" value={addForm.markupPercent} onChange={e => setAddForm(f => ({ ...f, markupPercent: e.target.value }))} className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
              </div>
            </div>
            {addForm.supplierPrice && (
              <p className="text-xs text-[#00C2FF]">Customer price: ${(Number(addForm.supplierPrice) * (1 + Number(addForm.markupPercent) / 100)).toFixed(2)}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">Stock Quantity</Label>
                <Input type="number" value={addForm.stockQuantity} onChange={e => setAddForm(f => ({ ...f, stockQuantity: e.target.value }))} disabled={addForm.stockUnlimited} className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10 disabled:opacity-50" />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center justify-between w-full">
                  <Label className="text-slate-300 text-sm">Unlimited Stock</Label>
                  <Switch checked={addForm.stockUnlimited} onCheckedChange={v => setAddForm(f => ({ ...f, stockUnlimited: v }))} />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">Delivery Note</Label>
              <Input value={addForm.deliveryNote} onChange={e => setAddForm(f => ({ ...f, deliveryNote: e.target.value }))} placeholder="e.g. Delivered within 5 minutes" className="bg-[#061A2B] border-[#0F3D5E] text-white focus:border-[#00C2FF] h-10" />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="text-sm text-white">Visible to customers</div>
              <Switch checked={addForm.isVisible} onCheckedChange={v => setAddForm(f => ({ ...f, isVisible: v }))} />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="text-sm text-white">Featured product</div>
              <Switch checked={addForm.isFeatured} onCheckedChange={v => setAddForm(f => ({ ...f, isFeatured: v }))} />
            </div>
            <Button className="w-full bg-[#00C2FF] hover:bg-[#00a8d4] text-white" onClick={handleAdd} disabled={addProduct.isPending}>
              {addProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
