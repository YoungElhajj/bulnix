/**
 * TelegramJoinPopup
 * Shows once after a user logs in, prompting them to join the Bulnix Telegram channel.
 * Dismissed state is stored in localStorage so it never shows again once closed or joined.
 */
import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

const STORAGE_KEY = "bulnix_telegram_popup_dismissed";
const TELEGRAM_URL = "https://t.me/Bulnixlimited";

export default function TelegramJoinPopup() {
  const { isAuthenticated, loading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    // Small delay so it doesn't pop immediately on page load
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, loading]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleJoin = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    window.open(TELEGRAM_URL, "_blank", "noopener,noreferrer");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-[#229ED9] to-[#00C2FF]" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 pt-5">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto"
            style={{ background: "#229ED9" }}>
            <Send className="w-7 h-7 text-white" />
          </div>

          {/* Text */}
          <h2 className="text-xl font-bold text-[#0D2137] text-center mb-2">
            Join the Bulnix Channel
          </h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-6">
            Get instant updates on new products, exclusive deals, and order alerts — all on Telegram.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleJoin}
              className="w-full h-11 font-semibold text-white rounded-xl"
              style={{ background: "#229ED9" }}
            >
              <Send className="w-4 h-4 mr-2" />
              Join Channel
            </Button>
            <button
              onClick={dismiss}
              className="w-full h-10 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
