import { useState, useEffect } from "react";
import { User, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Profile() {
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", country: "", preferredCurrency: "USD" as "NGN"|"USD"|"EUR"|"GBP", notifyEmail: true, notifyOrders: true });

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name ?? "", country: (user as any).country ?? "", preferredCurrency: (user as any).preferredCurrency ?? "USD", notifyEmail: (user as any).notifyEmail ?? true, notifyOrders: (user as any).notifyOrders ?? true }));
  }, [user]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated!"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="min-h-screen bg-[#061A2B] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#061A2B] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-white mb-4">Sign in to view profile</h2>
        <Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = '/login'; }}>Sign In</Button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#061A2B] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5"><div className="container"><h1 className="text-3xl font-bold text-white">Profile Settings</h1></div></div>
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="glass-card rounded-xl p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C2FF] to-[#00C2FF] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-white text-lg">{user?.name ?? "User"}</div>
            <div className="text-slate-500 text-sm">{user?.email}</div>
            <div className="text-xs text-slate-600 mt-1">Member since {new Date((user as any)?.createdAt ?? Date.now()).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-white mb-2">Personal Information</h2>
          <div><Label className="text-slate-300 text-sm mb-1.5 block">Display Name</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" className="bg-[#0A2540] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-10"/></div>
          <div><Label className="text-slate-300 text-sm mb-1.5 block">Email</Label><Input value={user?.email ?? ""} disabled className="bg-[#0A2540] border-[#0F3D5E] text-slate-500 h-10 cursor-not-allowed"/></div>
          <div><Label className="text-slate-300 text-sm mb-1.5 block">Country</Label><Input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} placeholder="e.g. Nigeria" className="bg-[#0A2540] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-10"/></div>
          <div><Label className="text-slate-300 text-sm mb-1.5 block">Preferred Currency</Label>
            <Select value={form.preferredCurrency} onValueChange={(v:any)=>setForm(f=>({...f,preferredCurrency:v}))}>
              <SelectTrigger className="bg-[#0A2540] border-[#0F3D5E] text-white h-10"><SelectValue/></SelectTrigger>
              <SelectContent className="bg-[#0A2540] border-[#0F3D5E]"><SelectItem value="USD">USD</SelectItem><SelectItem value="NGN">NGN</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="border-t border-[#0F3D5E] pt-5">
            <h3 className="text-sm font-semibold text-white mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div><div className="text-sm text-white">Email Notifications</div><div className="text-xs text-slate-500">Receive emails about your account</div></div><Switch checked={form.notifyEmail} onCheckedChange={v=>setForm(f=>({...f,notifyEmail:v}))}/></div>
              <div className="flex items-center justify-between"><div><div className="text-sm text-white">Order Updates</div><div className="text-xs text-slate-500">Get notified when orders change status</div></div><Switch checked={form.notifyOrders} onCheckedChange={v=>setForm(f=>({...f,notifyOrders:v}))}/></div>
            </div>
          </div>
          <Button className="w-full h-11 bg-[#00C2FF] hover:bg-[#00a8d4] text-white font-semibold" onClick={()=>updateProfile.mutate(form)} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Save Changes
          </Button>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
