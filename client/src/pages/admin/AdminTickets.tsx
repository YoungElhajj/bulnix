import { useState } from "react";
import { Ticket, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminTickets() {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [closeTicket, setCloseTicket] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.tickets.list.useQuery({ page, limit: 50, status: status === "all" ? undefined : status }, { enabled: isAuthenticated && user?.role === "admin", retry: false });
  const replyMutation = trpc.admin.tickets.reply.useMutation({
    onSuccess: () => { toast.success("Reply sent"); setSelected(null); setReply(""); utils.admin.tickets.list.invalidate(); },
    onError: e => toast.error(e.message),
  });

  const tickets = (data as any)?.tickets ?? [];
  const total = (data as any)?.total ?? 0;
  const statusColor = (s: string) => ({ open: "bg-[#00B9E9]/10 text-[#00B9E9]", in_progress: "bg-yellow-500/10 text-yellow-400", resolved: "bg-[#22C55E]/10 text-[#22C55E]", closed: "bg-slate-500/10 text-slate-400" }[s] ?? "bg-slate-500/10 text-slate-400");
  const priorityColor = (p: string) => ({ low: "text-slate-400", medium: "text-yellow-400", high: "text-orange-400", urgent: "text-red-400" }[p] ?? "text-slate-400");

  return (
    <AdminLayout title="Support Tickets">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">Support Tickets</h1><p className="text-slate-500 text-sm mt-0.5">{total} tickets</p></div>
        <Select value={status} onValueChange={v=>{setStatus(v);setPage(1);}}>
          <SelectTrigger className="w-[140px] bg-[#0F172A] border-white/10 text-white h-9"><SelectValue/></SelectTrigger>
          <SelectContent className="bg-[#0F172A] border-white/10">
            <SelectItem value="all">All</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_,i)=><div key={i} className="glass-card rounded-xl h-14 animate-pulse"/>)}</div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-slate-500 text-xs uppercase">
                <th className="text-left p-4">Ticket</th>
                <th className="text-left p-4">User</th>
                <th className="text-center p-4">Priority</th>
                <th className="text-center p-4">Status</th>
                <th className="text-left p-4">Created</th>
                <th className="text-center p-4">Actions</th>
              </tr></thead>
              <tbody>
                {tickets.map((ticket: any) => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="p-4">
                      <div className="text-white font-medium">{ticket.subject}</div>
                      <div className="text-xs text-slate-500">#{ticket.id}</div>
                    </td>
                    <td className="p-4 text-slate-300">User #{ticket.userId}</td>
                    <td className="p-4 text-center"><span className={"text-xs font-semibold " + priorityColor(ticket.priority)}>{ticket.priority}</span></td>
                    <td className="p-4 text-center"><Badge className={"text-xs border-0 " + statusColor(ticket.status)}>{ticket.status.replace("_"," ")}</Badge></td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(ticket.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button onClick={()=>{setSelected(ticket);setReply("");setCloseTicket(false);}} className="px-2 py-1 rounded bg-[#00B9E9]/10 text-[#00B9E9] hover:bg-[#00B9E9]/20 text-xs transition-colors flex items-center gap-1 mx-auto">
                        <MessageSquare className="h-3 w-3"/> Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={v=>!v&&setSelected(null)}>
        <DialogContent className="bg-[#0F172A] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-white">Reply to Ticket #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-white/5 rounded-lg"><div className="text-xs text-slate-500 mb-1">Subject</div><div className="text-sm text-white">{selected.subject}</div></div>
              <div><textarea value={reply} onChange={e=>setReply(e.target.value)} rows={4} placeholder="Type your reply..." className="w-full bg-[#0B0F19] border border-white/10 text-white placeholder:text-slate-600 focus:border-[#00B9E9] rounded-lg p-3 text-sm resize-none outline-none transition-colors"/></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="close" checked={closeTicket} onChange={e=>setCloseTicket(e.target.checked)} className="rounded"/>
                <label htmlFor="close" className="text-sm text-slate-300">Close ticket after reply</label>
              </div>
              <Button className="w-full bg-[#00B9E9] hover:bg-[#00a8d4] text-white" onClick={()=>replyMutation.mutate({ticketId:selected.id,message:reply,closeTicket})} disabled={!reply.trim() || replyMutation.isPending}>
                <Send className="h-4 w-4 mr-2"/> Send Reply
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
