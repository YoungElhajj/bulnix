import { useState } from "react";
import { Plus, Edit, Eye, EyeOff, Loader2, Trash2, Image, ChevronRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminCategories() {
  const { isAuthenticated, user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", imageUrl: "", parentId: "" });
  const [editForm, setEditForm] = useState<any>({});
  const [showSubs, setShowSubs] = useState<Record<number, boolean>>({});

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
  const { data: categories, isLoading } = trpc.admin.categories.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin", retry: false
  });

  const createCat = trpc.admin.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created!");
      setCreateOpen(false);
      setForm({ name: "", slug: "", description: "", imageUrl: "", parentId: "" });
      utils.admin.categories.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const updateCat = trpc.admin.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated");
      setEditOpen(false);
      setEditing(null);
      utils.admin.categories.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const deleteCat = trpc.admin.categories.delete.useMutation({
    onSuccess: () => { toast.success("Category deleted"); utils.admin.categories.list.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const cats = (categories as any[] | undefined) ?? [];
  const topLevel = cats.filter((c: any) => !c.parentId);
  const getSubcats = (parentId: number) => cats.filter((c: any) => c.parentId === parentId);

  const openEdit = (cat: any) => {
    setEditing(cat);
    setEditForm({
      name: cat.name ?? "",
      slug: cat.slug ?? "",
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
      parentId: cat.parentId ? String(cat.parentId) : "",
      isVisible: cat.isVisible ?? true,
      sortOrder: cat.sortOrder ?? 0,
    });
    setEditOpen(true);
  };

  const handleCreate = () => {
    if (!form.name || !form.slug) { toast.error("Name and slug are required"); return; }
    createCat.mutate({
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      parentId: form.parentId ? Number(form.parentId) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    updateCat.mutate({
      id: editing.id,
      name: editForm.name || undefined,
      slug: editForm.slug || undefined,
      description: editForm.description || undefined,
      imageUrl: editForm.imageUrl || undefined,
      parentId: editForm.parentId ? Number(editForm.parentId) : null,
      isVisible: editForm.isVisible,
      sortOrder: Number(editForm.sortOrder) || 0,
    });
  };

  return (
    <AdminLayout title="Categories">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2137]">Categories</h1>
          <p className="text-[#4A6080] text-sm mt-0.5">{topLevel.length} top-level · {cats.length - topLevel.length} subcategories</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] h-9">
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-[#D8E8F5] text-[#0D2137] max-w-md">
            <DialogHeader><DialogTitle className="text-[#0D2137]">Create Category</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") }))} placeholder="e.g. Social Media" className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Slug *</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. social-media" className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Description</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Parent Category (for subcategory)</Label>
                <Select value={form.parentId} onValueChange={v => setForm(f => ({ ...f, parentId: v }))}>
                  <SelectTrigger className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#D8E8F5] text-[#0D2137]">
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {topLevel.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137]" onClick={handleCreate} disabled={createCat.isPending || !form.name || !form.slug}>
                {createCat.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl h-14 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-1">
          {topLevel.map((cat: any) => {
            const subs = getSubcats(cat.id);
            const expanded = showSubs[cat.id];
            return (
              <div key={cat.id}>
                {/* Top-level row */}
                <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl px-4 py-3 flex items-center gap-3">
                  {/* Icon preview */}
                  <div className="w-9 h-9 rounded-lg bg-[#F5F9FF] border border-white/8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <Image className="h-4 w-4 text-[#4A6080]" />
                    )}
                  </div>
                  {/* Name + slug */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[#0D2137] font-medium text-sm">{cat.name}</span>
                      {subs.length > 0 && (
                        <Badge className="bg-[#EEF4FF] text-[#0050D0] border-0 text-xs">{subs.length} sub</Badge>
                      )}
                    </div>
                    <div className="text-xs text-[#4A6080] font-mono">{cat.slug}</div>
                  </div>
                  {/* Description */}
                  <div className="hidden md:block text-xs text-[#4A6080] max-w-[160px] truncate">{cat.description ?? "—"}</div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    {subs.length > 0 && (
                      <button onClick={() => setShowSubs(s => ({ ...s, [cat.id]: !s[cat.id] }))} className="w-7 h-7 rounded-lg bg-[#F5F9FF] text-[#4A6080] hover:text-[#0D2137] flex items-center justify-center transition-colors">
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </button>
                    )}
                    <button onClick={() => updateCat.mutate({ id: cat.id, isVisible: !cat.isVisible })} className={"w-7 h-7 rounded-lg flex items-center justify-center transition-colors " + (cat.isVisible ? "bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20" : "bg-slate-500/10 text-[#4A6080] hover:bg-slate-500/20")}>
                      {cat.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => openEdit(cat)} className="w-7 h-7 rounded-lg bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20 flex items-center justify-center transition-colors">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteCat.mutate({ id: cat.id }); }} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategory rows */}
                {expanded && subs.map((sub: any) => (
                  <div key={sub.id} className="ml-8 mt-1 bg-white border border-[#D8E8F5] shadow-sm rounded-xl px-4 py-2.5 flex items-center gap-3 border-l-2 border-[#0050D0]/20">
                    <div className="w-7 h-7 rounded-lg bg-[#F5F9FF] border border-white/8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {sub.imageUrl ? <img src={sub.imageUrl} alt={sub.name} className="w-5 h-5 object-contain" /> : <Image className="h-3 w-3 text-[#4A6080]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#0D2137] text-sm">{sub.name}</div>
                      <div className="text-xs text-[#4A6080] font-mono">{sub.slug}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <button onClick={() => updateCat.mutate({ id: sub.id, isVisible: !sub.isVisible })} className={"w-7 h-7 rounded-lg flex items-center justify-center transition-colors " + (sub.isVisible ? "bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20" : "bg-slate-500/10 text-[#4A6080] hover:bg-slate-500/20")}>
                        {sub.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => openEdit(sub)} className="w-7 h-7 rounded-lg bg-[#EEF4FF] text-[#0050D0] hover:bg-[#00C2FF]/20 flex items-center justify-center transition-colors">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${sub.name}"?`)) deleteCat.mutate({ id: sub.id }); }} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={v => { if (!v) { setEditOpen(false); setEditing(null); } }}>
        <DialogContent className="bg-white border-[#D8E8F5] text-[#0D2137] max-w-lg">
          <DialogHeader><DialogTitle className="text-[#0D2137]">Edit Category</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block">Name</Label>
                  <Input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
                </div>
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block">Slug</Label>
                  <Input value={editForm.slug} onChange={e => setEditForm((f: any) => ({ ...f, slug: e.target.value }))} className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
                </div>
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Description</Label>
                <Input value={editForm.description} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Category Icon / Image</Label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input value={editForm.imageUrl} onChange={e => setEditForm((f: any) => ({ ...f, imageUrl: e.target.value }))} placeholder="Paste URL or upload file" className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#D8E8F5] hover:border-[#0050D0]/50 cursor-pointer transition-colors bg-[#F5F9FF] text-xs text-[#4A6080] hover:text-[#0050D0]">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {uploading ? "Uploading..." : "Upload icon (PNG, JPG, SVG, max 5MB)"}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, url => setEditForm((fm: any) => ({ ...fm, imageUrl: url }))); }} />
                    </label>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-[#F5F9FF] border border-[#D8E8F5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {editForm.imageUrl
                      ? <img src={editForm.imageUrl} alt="preview" className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      : <Image className="h-6 w-6 text-[#4A6080]" />}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-[#4A6080] text-sm mb-1.5 block">Parent Category</Label>
                <Select value={editForm.parentId || "none"} onValueChange={v => setEditForm((f: any) => ({ ...f, parentId: v === "none" ? "" : v }))}>
                  <SelectTrigger className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#D8E8F5] text-[#0D2137]">
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {topLevel.filter((c: any) => c.id !== editing.id).map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#4A6080] text-sm mb-1.5 block">Sort Order</Label>
                  <Input type="number" value={editForm.sortOrder} onChange={e => setEditForm((f: any) => ({ ...f, sortOrder: e.target.value }))} className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] focus:border-[#0050D0] h-10" />
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center justify-between w-full">
                    <Label className="text-[#4A6080] text-sm">Visible</Label>
                    <Switch checked={editForm.isVisible} onCheckedChange={v => setEditForm((f: any) => ({ ...f, isVisible: v }))} />
                  </div>
                </div>
              </div>
              <Button className="w-full bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137]" onClick={handleUpdate} disabled={updateCat.isPending}>
                {updateCat.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
