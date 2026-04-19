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

  if (loading) return <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin"/></div>;
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center">
      <div className="text-center"><h2 className="text-2xl font-bold text-[#0D2137] mb-4">Sign in to view tickets</h2>
        <Button className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137]" onClick={() => { window.location.href = '/login'; }}>Sign In</Button></div>
    </div>
  );

  const ticketList = (tickets as any[]) ?? [];
  const statusColor = (s: string) => ({ open: "bg-[#EEF4FF] text-[#0050D0]", in_progress: "bg-yellow-500/10 text-yellow-400", resolved: "bg-[#EEF4FF] text-[#0050D0]", closed: "bg-slate-500/10 text-[#4A6080]" }[s] ?? "bg-slate-500/10 text-[#4A6080]");

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container flex items-center justify-between flex-wrap gap-4">
          <div><h1 className="text-3xl font-bold text-white">Support Tickets</h1><p className="text-white/60 mt-1">{ticketList.length} tickets</p></div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-[#0050D0] hover:bg-[#0040b0] text-white"><Plus className="h-4 w-4 mr-2"/> New Ticket</Button></DialogTrigger>
            <DialogContent className="bg-white border-[#D8E8F5] text-[#0D2137] max-w-lg">
              <DialogHeader><DialogTitle className="text-[#0D2137]">Create Support Ticket</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Subject *</Label><Input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="Brief description" className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] h-10"/></div>
                <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Priority</Label>
                  <Select value={form.priority} onValueChange={v=>setForm(f=>({...f,priority:v}))}>
                    <SelectTrigger className="bg-[#F5F9FF] border-[#D8E8F5] text-[#0D2137] h-10"><SelectValue/></SelectTrigger>
                    <SelectContent className="bg-white border-[#D8E8F5]"><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-[#4A6080] text-sm mb-1.5 block">Message *</Label><textarea value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={4} placeholder="Describe your issue..." className="w-full bg-[#F5F9FF] border border-[#D8E8F5] text-[#0D2137] placeholder:text-[#4A6080] focus:border-[#0050D0] rounded-lg p-3 text-sm resize-none outline-none transition-colors"/></div>
                <Button className="w-full bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137]" onClick={()=>createTicket.mutate({subject:form.subject,message:form.message,priority:form.priority as any})} disabled={createTicket.isPending || !form.subject || !form.message}>
                  {createTicket.isPending ? "Creating..." : "Submit Ticket"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="container py-8">
        {isLoading ? <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 h-20 animate-pulse"/>)}</div>
        : ticketList.length === 0 ? (
          <div className="text-center py-20"><Ticket className="h-16 w-16 text-[#4A6080] mx-auto mb-4"/><h3 className="text-xl font-semibold text-[#0D2137] mb-2">No tickets yet</h3><p className="text-[#4A6080]">Need help? Create a support ticket.</p></div>
        ) : (
          <div className="space-y-3">
            {ticketList.map((ticket: any) => (
              <Link key={ticket.id} href={"/tickets/" + ticket.id}>
                <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-5 cursor-pointer hover:border-[#D8E8F5] transition-all group">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="h-5 w-5 text-[#0050D0] flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-semibold text-[#0D2137] text-sm">{ticket.subject}</span>
                        <Badge className={"text-xs border-0 " + statusColor(ticket.status)}>{ticket.status.replace("_"," ")}</Badge>
                      </div>
                      <div className="text-xs text-[#4A6080]">{new Date(ticket.createdAt).toLocaleString()}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#4A6080] group-hover:text-[#0050D0] transition-colors flex-shrink-0"/>
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
