import { useState } from "react";
import { Package, Search, Edit, Eye, EyeOff, Star, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.products.list.useQuery({ page, limit: 50, search: search || undefined }, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const updateProduct = trpc.admin.products.update.useMutation({
    onSuccess: () => { toast.success("Product updated!"); setEditing(null); utils.admin.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const products = (data as any)?.products ?? [];
  const total = (data as any)?.total ?? 0;

  const openEdit = (p: any) => {
    setEditing(p);
    setEditForm({ title: p.title, description: p.description ?? "", markupPercent: p.markupPercent ?? 20, isVisible: p.isVisible, isFeatured: p.isFeatured, deliveryNote: p.deliveryNote ?? "" });
  };

  return (
    <AdminLayout title="Products">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">Products</h1><p className="text-slate-500 text-sm mt-0.5">{total} total products</p></div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"/>
          <Input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search products..." className="pl-9 bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] h-9"/>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_,i)=><div key={i} className="glass-card rounded-xl h-14 animate-pulse"/>)}</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-slate-500 text-xs uppercase">
                <th className="text-left p-4">Product</th>
                <th className="text-left p-4">Provider</th>
                <th className="text-right p-4">Base Price</th>
                <th className="text-right p-4">Markup</th>
                <th className="text-right p-4">Customer Price</th>
                <th className="text-center p-4">Stock</th>
                <th className="text-center p-4">Visible</th>
                <th className="text-center p-4">Featured</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center flex-shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover rounded-lg"/> : <Package className="h-4 w-4 text-slate-600"/>}
                        </div>
                        <div className="min-w-0"><div className="text-white font-medium truncate max-w-[200px]">{p.title}</div><div className="text-xs text-slate-500">{p.slug}</div></div>
                      </div>
                    </td>
                    <td className="p-4"><Badge className="bg-[#00B9E9]/10 text-[#00B9E9] border-0 text-xs">{p.providerKey}</Badge></td>
                    <td className="p-4 text-right text-slate-300">${Number(p.basePriceUSD).toFixed(2)}</td>
                    <td className="p-4 text-right text-slate-300">{p.markupPercent}%</td>
                    <td className="p-4 text-right font-semibold text-[#22C55E]">${Number(p.customerPriceUSD).toFixed(2)}</td>
                    <td className="p-4 text-center text-slate-300">{p.stockUnlimited ? "∞" : p.stockQuantity}</td>
                    <td className="p-4 text-center">
                      <button onClick={()=>updateProduct.mutate({id:p.id,isVisible:!p.isVisible})} className={"w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors " + (p.isVisible ? "bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20")}>
                        {p.isVisible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={()=>updateProduct.mutate({id:p.id,isFeatured:!p.isFeatured})} className={"w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors " + (p.isFeatured ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20")}>
                        <Star className={"h-4 w-4 " + (p.isFeatured ? "fill-yellow-400" : "")}/>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={()=>openEdit(p)} className="w-8 h-8 rounded-lg bg-[#00B9E9]/10 text-[#00B9E9] hover:bg-[#00B9E9]/20 flex items-center justify-center mx-auto transition-colors">
                        <Edit className="h-4 w-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 50 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-white/10">
              <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 h-8 text-xs" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
              <span className="text-slate-500 text-xs px-3">Page {page}</span>
              <Button variant="outline" className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5 h-8 text-xs" disabled={products.length < 50} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={v=>!v&&setEditing(null)}>
        <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-white">Edit Product</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4 mt-2">
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Title Override</Label><Input value={editForm.title} onChange={e=>setEditForm((f:any)=>({...f,title:e.target.value}))} className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10"/></div>
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Description Override</Label><textarea value={editForm.description} onChange={e=>setEditForm((f:any)=>({...f,description:e.target.value}))} rows={3} className="w-full bg-[#0B0F19] border border-white/10 text-white focus:border-[#00B9E9] rounded-lg p-3 text-sm resize-none outline-none transition-colors"/></div>
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Markup % (applied to base price)</Label><Input type="number" value={editForm.markupPercent} onChange={e=>setEditForm((f:any)=>({...f,markupPercent:Number(e.target.value)}))} className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10"/></div>
              <div><Label className="text-slate-300 text-sm mb-1.5 block">Delivery Note</Label><Input value={editForm.deliveryNote} onChange={e=>setEditForm((f:any)=>({...f,deliveryNote:e.target.value}))} placeholder="e.g. Delivered within 5 minutes" className="bg-[#0B0F19] border-white/10 text-white focus:border-[#00B9E9] h-10"/></div>
              <div className="flex items-center justify-between">
                <div><div className="text-sm text-white">Visible to customers</div></div>
                <Switch checked={editForm.isVisible} onCheckedChange={v=>setEditForm((f:any)=>({...f,isVisible:v}))}/>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-sm text-white">Featured product</div></div>
                <Switch checked={editForm.isFeatured} onCheckedChange={v=>setEditForm((f:any)=>({...f,isFeatured:v}))}/>
              </div>
              <Button className="w-full bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={()=>updateProduct.mutate({id:editing.id,...editForm})} disabled={updateProduct.isPending}>
                {updateProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
