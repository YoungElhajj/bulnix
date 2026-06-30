import { useState, useEffect } from "react";
import { Save, Loader2, Trophy, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getUserTier, getNextTier, getProgressToNextTier, TIERS } from "@/lib/tiers";

export default function Profile() {
  const { user, isAuthenticated, loading, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", country: "", preferredCurrency: "USD" as "NGN"|"USD"|"EUR"|"GBP", notifyEmail: true, notifyOrders: true });
  const walletQuery = trpc.wallet.get.useQuery(undefined, { enabled: isAuthenticated });
  const wallet = walletQuery.data;
  const totalSpent = parseFloat((wallet as any)?.totalSpent ?? "0");
  const tier = getUserTier(totalSpent);
  const nextTier = getNextTier(totalSpent);
  const progress = getProgressToNextTier(totalSpent);

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name ?? "", country: (user as any).country ?? "", preferredCurrency: (user as any).preferredCurrency ?? "USD", notifyEmail: (user as any).notifyEmail ?? true, notifyOrders: (user as any).notifyOrders ?? true }));
  }, [user]);

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated!"); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-[#0D2137] mb-4">Sign in to view profile</h2>
        <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white" onClick={() => { window.location.href = '/login'; }}>Sign In</Button></div>
    </div>
  );

  const tierProgressColor = tier.name === 'Bronze' ? 'bg-amber-500' : tier.name === 'Silver' ? 'bg-slate-400' : tier.name === 'Gold' ? 'bg-yellow-500' : tier.name === 'Platinum' ? 'bg-cyan-500' : 'bg-purple-500';

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <BackButton className="mb-3" />
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:"'Poppins', sans-serif"}}>Profile Settings</h1>
        </div>
      </div>
      <div className="container py-8 max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0F3D5E] to-[#0050D0] flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {(user?.name ?? user?.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[#0D2137] text-lg">{user?.name ?? "User"}</div>
            <div className="text-[#4A6080] text-sm truncate">{user?.email}</div>
            <div className="text-xs text-[#4A6080] mt-1">Member since {new Date((user as any)?.createdAt ?? Date.now()).toLocaleDateString()}</div>
          </div>
        </div>

        <div className={`rounded-xl border-2 ${tier.borderColor} ${tier.bgColor} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className={`w-6 h-6 ${tier.color} flex-shrink-0`} />
            <div>
              <div className={`font-bold text-lg ${tier.color}`}>{tier.emoji} {tier.name} Member</div>
              <div className="text-sm text-[#4A6080]">{tier.description}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mb-1 flex-wrap gap-1">
            <span className="text-[#4A6080]">Total spent: <span className="font-semibold text-[#0D2137]">${totalSpent.toFixed(2)}</span></span>
            {nextTier && <span className="text-[#4A6080]">Next: <span className={`font-semibold ${nextTier.color}`}>{nextTier.emoji} {nextTier.name}</span> at ${nextTier.minSpend}</span>}
          </div>
          {nextTier && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className={`h-2 rounded-full transition-all duration-500 ${tierProgressColor}`} style={{width:`${progress}%`}}/>
            </div>
          )}
          {!nextTier && <div className="text-sm font-semibold text-purple-700 mt-1">You have reached the highest tier. Thank you!</div>}
          <div className="mt-4 grid grid-cols-5 gap-1">
            {TIERS.map((t) => (
              <div key={t.name} className={`text-center rounded-lg p-2 border ${totalSpent >= t.minSpend ? `${t.bgColor} ${t.borderColor}` : 'bg-gray-50 border-gray-200 opacity-40'}`}>
                <div className="text-lg">{t.emoji}</div>
                <div className={`text-xs font-semibold ${totalSpent >= t.minSpend ? t.color : 'text-gray-400'}`}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#0D2137] mb-2">Personal Information</h2>
          <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Display Name</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/></div>
          <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Email</Label><Input value={user?.email ?? ""} disabled className="bg-white border-[#D8E8F5] text-[#4A6080] h-10 cursor-not-allowed"/></div>
          <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Country</Label><Input value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} placeholder="e.g. Nigeria" className="bg-white border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/></div>
          <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Preferred Currency</Label>
            <Select value={form.preferredCurrency} onValueChange={(v:any)=>setForm(f=>({...f,preferredCurrency:v}))}>
              <SelectTrigger className="bg-white border-[#D8E8F5] text-[#0D2137] h-10"><SelectValue/></SelectTrigger>
              <SelectContent className="bg-white border-[#D8E8F5]"><SelectItem value="USD">USD</SelectItem><SelectItem value="NGN">NGN</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="border-t border-[#D8E8F5] pt-5">
            <h3 className="text-sm font-semibold text-[#0D2137] mb-4">Notifications</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div><div className="text-sm text-[#0D2137]">Email Notifications</div><div className="text-xs text-[#4A6080]">Receive emails about your account</div></div><Switch checked={form.notifyEmail} onCheckedChange={v=>setForm(f=>({...f,notifyEmail:v}))}/></div>
              <div className="flex items-center justify-between"><div><div className="text-sm text-[#0D2137]">Order Updates</div><div className="text-xs text-[#4A6080]">Get notified when orders change status</div></div><Switch checked={form.notifyOrders} onCheckedChange={v=>setForm(f=>({...f,notifyOrders:v}))}/></div>
            </div>
          </div>
          <Button className="w-full h-11 bg-[#0050D0] hover:bg-[#0040b0] text-white font-semibold" onClick={()=>updateProfile.mutate(form)} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Save className="h-4 w-4 mr-2"/>} Save Changes
          </Button>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
