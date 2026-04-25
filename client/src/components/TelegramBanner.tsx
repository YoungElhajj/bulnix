/**
 * TelegramBanner
 * A dismissible banner inviting users to join the Bulnix Telegram channel.
 * Update TELEGRAM_URL to your real channel link.
 */
import { useState } from "react";
import { Send, X } from "lucide-react";

const TELEGRAM_URL = "https://t.me/bulnixupdates";

export default function TelegramBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("tg_banner_dismissed") === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("tg_banner_dismissed", "1"); } catch {}
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #0B1929 0%, #0D2137 50%, #0B1929 100%)",
        borderBottom: "1px solid rgba(34,158,217,0.2)",
      }}
    >
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-96 h-12 bg-[#229ED9]/10 blur-2xl" />
      </div>

      <div className="container relative z-10 flex items-center justify-between gap-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: "#229ED9" }}>
            <Send className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm text-slate-300 truncate">
            <span className="font-semibold text-white">Join our Telegram channel</span>
            <span className="hidden sm:inline"> for exclusive deals, restocks and live updates</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-1.5 rounded-full transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
            style={{ background: "#229ED9", color: "#fff" }}
          >
            Join Now
          </a>
          <button
            onClick={dismiss}
            className="p-1 rounded-full text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
