import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [reply, setReply] = useState("");
  const ticketId = parseInt(params.id ?? "0");
  const utils = trpc.useUtils();
  const { data: ticket, isLoading } = trpc.tickets.getById.useQuery({ id: ticketId }, { enabled: isAuthenticated && !!ticketId, retry: 2, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000) });
  const replyMutation = trpc.tickets.reply.useMutation({
    onSuccess: () => { setReply(""); utils.tickets.getById.invalidate({ id: ticketId }); toast.success("Reply sent"); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="min-h-screen bg-[#F5F9FF] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0050D0] border-t-transparent rounded-full animate-spin"/></div>;
  if (!ticket) return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137] flex items-center justify-center">
      <div className="text-center"><h2 className="text-xl font-bold mb-2">Ticket not found</h2><Link href="/tickets"><Button className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137] mt-3">Back to Tickets</Button></Link></div>
    </div>
  );

  const t = ticket as any;
  const messages = t.messages ?? [];
  const statusColor = { open: "bg-[#EEF4FF] text-[#0050D0]", in_progress: "bg-yellow-500/10 text-yellow-400", resolved: "bg-[#EEF4FF] text-[#0050D0]", closed: "bg-slate-500/10 text-[#4A6080]" }[t.status as string] ?? "bg-slate-500/10 text-[#4A6080]";

  return (
    <div className="min-h-screen bg-[#F5F9FF] text-[#0D2137]"><Navbar/>
      <div className="bg-[#0F3D5E] pt-24 pb-8">
        <div className="container">
          <BackButton href="/tickets" label="Back to Tickets" className="mb-4" />
          <div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-bold text-white">{t.subject}</h1><Badge className={"border-0 " + statusColor}>{t.status.replace("_"," ")}</Badge></div>
          <p className="text-white/60 text-sm mt-1">Ticket #{t.id} · {new Date(t.createdAt).toLocaleString()}</p>
        </div>
      </div>
      <div className="container py-8 max-w-3xl mx-auto">
        <div className="space-y-4 mb-6">
          {messages.map((msg: any, i: number) => (
            <div key={i} className={"flex gap-3 " + (msg.senderType === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-[80%] rounded-xl p-4 " + (msg.senderType === "user" ? "bg-[#EEF4FF] border border-[#0050D0]/20" : "bg-white border border-[#D8E8F5] shadow-sm")}>
                <div className="text-xs text-[#4A6080] mb-1">{msg.senderType === "user" ? "You" : "Support Team"} · {new Date(msg.createdAt).toLocaleString()}</div>
                <p className="text-sm text-[#0D2137] leading-relaxed">{msg.message}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && <div className="text-center py-8 text-[#4A6080] text-sm">No messages yet. Our team will respond shortly.</div>}
        </div>
        {t.status !== "closed" && (
          <div className="bg-white border border-[#D8E8F5] shadow-sm rounded-xl p-4">
            <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Type your reply..." className="w-full bg-transparent text-[#0D2137] placeholder:text-[#4A6080] text-sm resize-none outline-none mb-3"/>
            <div className="flex justify-end">
              <Button size="sm" className="bg-[#0050D0] hover:bg-[#0040b0] text-[#0D2137]" onClick={()=>replyMutation.mutate({ticketId:t.id,message:reply})} disabled={!reply.trim() || replyMutation.isPending}>
                <Send className="h-3.5 w-3.5 mr-1.5"/> Send Reply
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
}
