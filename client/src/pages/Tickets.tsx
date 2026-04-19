import { useState } from "react";
import { Link } from "wouter";
import { Ticket, Plus, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Tickets() {
  const { isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", priority: "medium" });
  const utils = trpc.useUtils();
  const { data: tickets, isLoading } = trpc.tickets.list.useQuery(undefined, { enabled: isAuthenticated, retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });
  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: () => { toast.success("Ticket created!"); setOpen(false); setForm({ subject: "", message: "", priority: "medium" }); utils.tickets.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="min-h-screen bg-[#061A2B] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#00C2FF] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#061A2B] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-white mb-4">Sign in to view tickets</h2>
        <Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white" onClick={() => { window.location.href = '/login'; }}>Sign In</Button></div>
    </div>
  );

  const ticketList = (tickets as any[]) ?? [];
  const statusColor = (s: string) => ({ open: "bg-[#00C2FF]/10 text-[#00C2FF]", in_progress: "bg-yellow-500/10 text-yellow-400", resolved: "bg-[#00C2FF]/10 text-[#00C2FF]", closed: "bg-slate-500/10 text-slate-400" }[s] ?? "bg-slate-500/10 text-slate-400");

  return (
    <div className="min-h-screen bg-[#061A2B] text-white"><Navbar/>
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold text-white">Support Tickets</h1><p className="text-slate-500 mt-1">{ticketList.length} tickets</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-[#00C2FF] hover:bg-[#00a8d4] text-white"><Plus className="h-4 w-4 mr-2"/> New Ticket</Button></DialogTrigger>
            <DialogContent className="bg-[#0A2540] border-[#0F3D5E] text-white max-w-lg">
              <DialogHeader><DialogTitle className="text-white">Create Support Ticket</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label className="text-slate-300 text-sm mb-1.5 block">Subject *</Label><Input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="Brief description" className="bg-[#061A2B] border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] h-10"/></div>
                <div><Label className="text-slate-300 text-sm mb-1.5 block">Priority</Label>
                  <Select value={form.priority} onValueChange={v=>setForm(f=>({...f,priority:v}))}>
                    <SelectTrigger className="bg-[#061A2B] border-[#0F3D5E] text-white h-10"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-[#0A2540] border-[#0F3D5E]"><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-slate-300 text-sm mb-1.5 block">Message *</Label><textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4} placeholder="Describe your issue..." className="w-full bg-[#061A2B] border border-[#0F3D5E] text-white placeholder:text-slate-600 focus:border-[#00C2FF] rounded-lg p-3 text-sm resize-none outline-none transition-colors"/></div>
                <Button className="w-full bg-[#00C2FF] hover:bg-[#00a8d4] text-white" onClick={()=>createTicket.mutate({subject:form.subject,message:form.message,priority:form.priority as any})} disabled={createTicket.isPending || !form.subject || !form.message}>
                  {createTicket.isPending ? "Creating..." : "Submit Ticket"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="container py-8">
        {isLoading ? <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="glass-card rounded-xl p-5 h-20 animate-pulse"/>)}</div>
        : ticketList.length === 0 ? (
          <div className="text-center py-20"><Ticket className="h-16 w-16 text-slate-700 mx-auto mb-4"/><h3 className="text-xl font-semibold text-white mb-2">No tickets yet</h3><p className="text-slate-500">Need help? Create a support ticket.</p></div>
        ) : (
          <div className="space-y-3">
            {ticketList.map((ticket: any) => (
              <Link key={ticket.id} href={"/tickets/" + ticket.id}>
                <div className="glass-card rounded-xl p-5 cursor-pointer hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="h-5 w-5 text-[#00C2FF] flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-semibold text-white text-sm">{ticket.subject}</span>
                        <Badge className={"text-xs border-0 " + statusColor(ticket.status)}>{ticket.status.replace("_"," ")}</Badge>
                      </div>
                      <div className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-[#00C2FF] transition-colors flex-shrink-0"/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
