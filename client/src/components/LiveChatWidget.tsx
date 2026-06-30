/**
 * LiveChatWidget
 * Floating live chat with automated responses for common questions.
 * Escalates to WhatsApp for complex issues.
 */
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronRight, ExternalLink } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/447988531474";
const BOT_NAME = "Bulnix Support";

type MessageRole = "bot" | "user";
interface ChatMessage {
  id: number;
  role: MessageRole;
  text: string;
  time: Date;
  options?: { label: string; value: string }[];
}

// ── Automated reply map ──────────────────────────────────────────────────────
const AUTO_REPLIES: Record<string, { text: string; options?: { label: string; value: string }[] }> = {
  start: {
    text: "Hi there! 👋 Welcome to Bulnix Support. How can I help you today?",
    options: [
      { label: "📦 Order Status", value: "order_status" },
      { label: "💳 Top Up Wallet", value: "topup" },
      { label: "🔄 Refund / Issue", value: "refund" },
      { label: "🛒 How to Buy", value: "how_to_buy" },
      { label: "🔑 Account Help", value: "account" },
      { label: "💬 Talk to Human", value: "human" },
    ],
  },
  order_status: {
    text: "To check your order status:\n\n1. Log in to your account\n2. Go to Dashboard → My Orders\n3. Click on any order to see its status and delivery details\n\nOrders are usually fulfilled within 5–30 minutes after payment is confirmed.",
    options: [
      { label: "My order is delayed", value: "order_delayed" },
      { label: "I didn't receive my order", value: "order_not_received" },
      { label: "Back to menu", value: "start" },
    ],
  },
  order_delayed: {
    text: "We're sorry for the delay! Most orders complete within 30 minutes. If it's been over 1 hour:\n\n• Check your email for delivery details\n• Check your Dashboard → My Orders\n• If still unresolved, our team will help you right away.",
    options: [
      { label: "Still need help", value: "human" },
      { label: "Back to menu", value: "start" },
    ],
  },
  order_not_received: {
    text: "If you haven't received your order:\n\n1. Check your registered email inbox (including spam)\n2. Go to Dashboard → My Orders and click the order\n3. The delivery details are shown there\n\nIf the order shows \"Fulfilled\" but you can't find the details, contact us and we'll resend them.",
    options: [
      { label: "Contact support", value: "human" },
      { label: "Back to menu", value: "start" },
    ],
  },
  topup: {
    text: "To top up your Bulnix wallet:\n\n1. Log in and go to Dashboard → Wallet\n2. Click \"Top Up\"\n3. Choose your payment method:\n   • Flutterwave (card/bank)\n   • Kora Pay (NGN)\n   • Crypto (min $10)\n\nFunds are credited instantly after payment confirmation.",
    options: [
      { label: "Payment not credited", value: "topup_issue" },
      { label: "Back to menu", value: "start" },
    ],
  },
  topup_issue: {
    text: "If your top-up payment was deducted but wallet wasn't credited:\n\n• Wait 5–10 minutes for the payment to be confirmed\n• Check your transaction history in the Wallet page\n• If still missing after 15 minutes, please contact us with your payment reference.",
    options: [
      { label: "Contact support", value: "human" },
      { label: "Back to menu", value: "start" },
    ],
  },
  refund: {
    text: "For refunds or product issues:\n\n1. Go to Dashboard → My Orders\n2. Open the affected order\n3. Click \"Open Support Ticket\"\n4. Describe the issue clearly\n\nOur team reviews all tickets within 2–4 hours and processes valid refunds to your wallet.",
    options: [
      { label: "I need urgent help", value: "human" },
      { label: "Back to menu", value: "start" },
    ],
  },
  how_to_buy: {
    text: "Buying on Bulnix is simple:\n\n1. Browse products or search for what you need\n2. Click a product and select quantity\n3. Add to cart or click \"Buy Now\"\n4. Complete checkout using your wallet balance\n5. Receive your order details by email within minutes\n\nMake sure your wallet is topped up before checkout!",
    options: [
      { label: "How to top up?", value: "topup" },
      { label: "Back to menu", value: "start" },
    ],
  },
  account: {
    text: "For account help:\n\n• **Forgot password** — use the \"Forgot Password\" link on the login page\n• **Email verification** — check your spam folder for the code\n• **Suspended account** — contact support with your registered email\n• **Change email/name** — go to Dashboard → Profile Settings",
    options: [
      { label: "Still need help", value: "human" },
      { label: "Back to menu", value: "start" },
    ],
  },
  human: {
    text: "No problem! Our support team is available on WhatsApp (UK line). Tap the button below to start a chat — we typically respond within a few minutes.",
    options: [
      { label: "📱 Open WhatsApp", value: "whatsapp" },
      { label: "Back to menu", value: "start" },
    ],
  },
};

let msgId = 0;
const makeMsg = (role: MessageRole, text: string, options?: { label: string; value: string }[]): ChatMessage => ({
  id: ++msgId,
  role,
  text,
  time: new Date(),
  options,
});

export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialise with greeting when opened for the first time
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = AUTO_REPLIES.start;
      setMessages([makeMsg("bot", greeting.text, greeting.options)]);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addBotReply = (key: string) => {
    const reply = AUTO_REPLIES[key];
    if (!reply) return;
    setTimeout(() => {
      setMessages(prev => [...prev, makeMsg("bot", reply.text, reply.options)]);
      if (!open) setUnread(n => n + 1);
    }, 400);
  };

  const handleOption = (value: string) => {
    if (value === "whatsapp") {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
      return;
    }
    // Show user's choice as a message
    const option = Object.values(AUTO_REPLIES)
      .flatMap(r => r.options ?? [])
      .find(o => o.value === value);
    if (option) {
      setMessages(prev => [...prev, makeMsg("user", option.label)]);
    }
    addBotReply(value);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages(prev => [...prev, makeMsg("user", text)]);

    // Simple keyword matching
    const lower = text.toLowerCase();
    if (lower.includes("order") || lower.includes("delivery") || lower.includes("received")) {
      addBotReply("order_status");
    } else if (lower.includes("top") || lower.includes("wallet") || lower.includes("fund") || lower.includes("deposit")) {
      addBotReply("topup");
    } else if (lower.includes("refund") || lower.includes("issue") || lower.includes("problem") || lower.includes("wrong")) {
      addBotReply("refund");
    } else if (lower.includes("buy") || lower.includes("purchase") || lower.includes("how")) {
      addBotReply("how_to_buy");
    } else if (lower.includes("account") || lower.includes("password") || lower.includes("login") || lower.includes("email")) {
      addBotReply("account");
    } else if (lower.includes("human") || lower.includes("agent") || lower.includes("person") || lower.includes("help")) {
      addBotReply("human");
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, makeMsg("bot",
          "I'm not sure I understood that. Let me show you what I can help with:",
          AUTO_REPLIES.start.options
        )]);
      }, 400);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 focus:outline-none"
        style={{ background: open ? "#334155" : "#0050D0", boxShadow: "0 0 24px rgba(0,80,208,0.35)" }}
        aria-label={open ? "Close chat" : "Open live chat"}
      >
        {open
          ? <X className="w-6 h-6 text-white" />
          : <>
              <MessageCircle className="w-6 h-6 text-white" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unread}
                </span>
              )}
            </>
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-44 right-6 z-50 w-[340px] max-h-[500px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0050D0] text-white">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{BOT_NAME}</div>
              <div className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online — typically replies in minutes
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFF]" style={{ maxHeight: 320 }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-[#0050D0] text-white rounded-br-sm"
                      : "bg-white text-[#0D2137] shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.time)}</span>

                {/* Quick reply options */}
                {msg.role === "bot" && msg.options && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleOption(opt.value)}
                        className="flex items-center gap-1 text-xs bg-white border border-[#0050D0]/30 text-[#0050D0] hover:bg-[#0050D0] hover:text-white rounded-full px-3 py-1 transition-colors font-medium"
                      >
                        {opt.value === "whatsapp" && <ExternalLink className="w-3 h-3" />}
                        {opt.label}
                        {opt.value !== "whatsapp" && <ChevronRight className="w-3 h-3 opacity-50" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-[#0050D0] transition-colors text-[#0D2137] placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-[#0050D0] flex items-center justify-center text-white disabled:opacity-40 transition-all hover:bg-[#0040b0] active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
