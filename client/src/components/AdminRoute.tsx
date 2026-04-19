import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * AdminRoute — wraps any admin page component.
 * - If the user is not authenticated OR not an admin, redirects to /secure-admin.
 * - Regular customers who stumble upon /admin/* are sent to /secure-admin, not /login.
 * - Shows a blank screen while the auth check is in flight (avoids flash of content).
 */
export default function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/secure-admin", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null; // useEffect will redirect
  }

  return <Component />;
}
