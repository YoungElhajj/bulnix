import { useState } from "react";
import { Plus, Edit, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminCategories() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.admin.categories.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const createCat = trpc.admin.categories.create.useMutation({
    onSuccess: () => { toast.success("Category created!"); setOpen(false); setForm({name:"",slug:"",description:""}); utils.admin.categories.list.invalidate(); },
    onError: e => toast.error(e.message),
  });
  const updateCat = trpc.admin.categories.update.useMutation({
    onSuccess: () => { toast.success("Category updated"); utils.admin.categories.list.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const cats = (categories as any[]) ?? [];

  return (
    <AdminLayout title="Categories">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">Categories</h1><p className="text-slate-500 text-sm mt-0.5">{cats.length} categories</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-[#00B9E9] hover:bg-[#00a8d4] text-white h-9"><Plus className="h-4 w-4 mr-2"/> Add Category</Button></DialogTrigger>
          <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-md">
            <DialogHeader><DialogTitle className="text-white">Create Category</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Name *</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value,slug:e.target.value.toLowerCase().replace(/\s+/g,"-")}))} placeholder="e.g. Social Media" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10"/></div>
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Slug *</Label><Input value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} placeholder="e.g. social-media" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10"/></div>
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Description</Label><Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional description" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10"/></div>
              <Button className="w-full bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={()=>createCat.mutate(form)} disabled={createCat.isPending || !form.name || !form.slug}>
                {createCat.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Plus className="h-4 w-4 mr-2"/>} Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="glass-card rounded-xl h-14 animate-pulse"/>)}</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10 text-slate-500 text-xs uppercase">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Slug</th>
              <th className="text-left p-4">Description</th>
              <th className="text-center p-4">Visible</th>
              <th className="text-center p-4">Sort</th>
            </tr></thead>
            <tbody>
              {cats.map((cat: any) => (
                <tr key={cat.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="p-4 font-medium text-white">{cat.name}</td>
                  <td className="p-4 text-slate-400 font-mono text-xs">{cat.slug}</td>
                  <td className="p-4 text-slate-500 text-xs max-w-[200px] truncate">{cat.description ?? "—"}</td>
                  <td className="p-4 text-center">
                    <button onClick={()=>updateCat.mutate({id:cat.id,isVisible:!cat.isVisible})} className={"w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors " + (cat.isVisible ? "bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20")}>
                      {cat.isVisible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <Input type="number" defaultValue={cat.sortOrder ?? 0} onBlur={e=>updateCat.mutate({id:cat.id,sortOrder:Number(e.target.value)})} className="w-16 mx-auto bg-[#0F172A] border-white/10 text-white text-center h-7 text-xs"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
