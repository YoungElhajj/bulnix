import { useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

export default function AdminLogs() {
  const { isAuthenticated, user } = useAuth();
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.admin.logs.list.useQuery({
    page, limit: 100,
    level: level === "all" ? undefined : level,
    category: category === "all" ? undefined : category,
  }, { enabled: isAuthenticated && user?.role === "admin", retry: false });

  const logs = (data as any)?.items ?? [];
  const total = (data as any)?.total ?? 0;
  const levelColor = (l: string) => ({ info: "bg-blue-500/10 text-blue-400", warn: "bg-yellow-500/10 text-yellow-400", error: "bg-red-500/10 text-red-400", debug: "bg-slate-500/10 text-slate-400" }[l] ?? "bg-slate-500/10 text-slate-400");

  return (
    <AdminLayout title="System Logs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-white">System Logs</h1><p className="text-slate-400 text-sm mt-0.5">{total} log entries</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={level} onValueChange={v=>{setLevel(v);setPage(1);}}>
            <SelectTrigger className="w-[120px] bg-[#0d1117] border-emerald-900/40 text-white h-9"><SelectValue/></SelectTrigger>
            <SelectContent className="bg-[#161b22] border-emerald-900/30">
              <SelectItem value="all">All Levels</SelectItem><SelectItem value="info">Info</SelectItem><SelectItem value="warn">Warn</SelectItem><SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={v=>{setCategory(v);setPage(1);}}>
            <SelectTrigger className="w-[140px] bg-[#0d1117] border-emerald-900/40 text-white h-9"><SelectValue/></SelectTrigger>
            <SelectContent className="bg-[#161b22] border-emerald-900/30">
              <SelectItem value="all">All Categories</SelectItem><SelectItem value="payment">Payment</SelectItem><SelectItem value="supplier">Supplier</SelectItem><SelectItem value="order">Order</SelectItem><SelectItem value="webhook">Webhook</SelectItem><SelectItem value="auth">Auth</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-emerald-900/30 text-slate-400 hover:text-white hover:bg-[#0d1117] h-9" onClick={()=>refetch()}>
            <RefreshCw className="h-4 w-4"/>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_,i)=><div key={i} className="bg-[#161b22] border border-emerald-900/30 rounded-xl h-12 animate-pulse"/>)}</div>
      ) : logs.length === 0 ? (
        <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl p-12 text-center">
          <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-white mb-2">No logs found</h3>
          <p className="text-slate-400 text-sm">System activity logs will appear here.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] border border-emerald-900/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="border-b border-emerald-900/30 text-slate-400 text-xs uppercase font-sans">
                <th className="text-left p-3">Time</th>
                <th className="text-center p-3">Level</th>
                <th className="text-center p-3">Category</th>
                <th className="text-left p-3">Message</th>
              </tr></thead>
              <tbody>
                {logs.map((log: any, i: number) => (
                  <tr key={i} className="border-b border-emerald-900/30 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3 text-center"><Badge className={"text-xs border-0 " + levelColor(log.level)}>{log.level}</Badge></td>
                    <td className="p-3 text-center text-slate-400">{log.category ?? "—"}</td>
                    <td className="p-3 text-slate-400 max-w-[400px] truncate">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 100 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-emerald-900/30">
              <Button variant="outline" className="border-emerald-900/30 text-slate-400 hover:text-white hover:bg-[#0d1117] h-8 text-xs" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
              <span className="text-slate-400 text-xs px-3">Page {page}</span>
              <Button variant="outline" className="border-emerald-900/30 text-slate-400 hover:text-white hover:bg-[#0d1117] h-8 text-xs" disabled={logs.length < 100} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
