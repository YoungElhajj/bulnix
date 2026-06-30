/**
 * TelegramJoinPopup
 * Shows once after a user logs in, prompting them to join the Bulnix Telegram channel.
 * Joining credits $0.50 to their wallet (one-time, server-enforced).
 * Dismissed state is stored in localStorage so it never shows again once closed or joined.
 */
import { useEffect, useState } from "react";
import { X, Send, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STORAGE_KEY = "bulnix_telegram_popup_dismissed";
const TELEGRAM_URL = "https://t.me/bulnixupdates";

export default function TelegramJoinPopup() {
  const { isAuthenticated, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const utils = trpc.useUtils();

  const claimBonus = trpc.auth.claimTelegramBonus.useMutation({
    onSuccess: (data) => {
      if (!data.alreadyClaimed) {
        toast.success(`$0.50 bonus credited to your wallet!`);
        utils.auth.me.invalidate();
      }
    },
    onError: () => {
      // Silently ignore — still open Telegram
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    // Small delay so it doesn't pop immediately on page load
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, loading]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleJoin = async () => {
    setClaiming(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    // Open Telegram channel
    window.open(TELEGRAM_URL, "_blank", "noopener,noreferrer");
    // Claim the $0.50 bonus
    try {
      await claimBonus.mutateAsync();
    } catch {
      // ignore
    } finally {
      setClaiming(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#229ED9] to-[#00C2FF]" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-5">
          {/* Bonus badge */}
          <div className="flex items-center justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              <Gift className="w-3.5 h-3.5" />
              FREE BONUS OFFER
            </span>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-lg"
            style={{ background: "linear-gradient(135deg, #229ED9, #00C2FF)" }}>
            <Send className="w-8 h-8 text-white" />
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-[#0D2137] text-center mb-1">
            Join Bulnix on Telegram
          </h2>
          <p className="text-2xl font-extrabold text-green-600 text-center mb-2">
            Get $0.50 FREE!
          </p>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
            Join our official Telegram channel and we will instantly deposit <strong>$0.50</strong> into your Bulnix wallet. Get exclusive deals, new product alerts, and order updates too!
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 text-center">
            <p className="text-xs text-blue-700 font-medium flex items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              Get exclusive deals, new products & order alerts on Telegram
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleJoin}
              disabled={claiming}
              className="w-full h-12 font-bold text-white rounded-xl text-base shadow-lg"
              style={{ background: "linear-gradient(135deg, #229ED9, #00a8e0)" }}
            >
              <Send className="w-4 h-4 mr-2" />
              {claiming ? "Claiming bonus..." : "Join & Claim $0.50 Now"}
            </Button>
            <button
              onClick={dismiss}
              className="w-full h-10 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              No thanks, skip the bonus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
