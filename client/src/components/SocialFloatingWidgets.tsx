/**
 * SocialFloatingWidgets
 * Floating support hub with:
 * - WhatsApp pre-triage chatbot (gathers issue context before redirecting to WhatsApp)
 * - Telegram channel join button
 * Main toggle shows a "Support" label so users know what it is.
 */
import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, ChevronRight, ExternalLink } from "lucide-react";

const WHATSAPP_BASE = "https://wa.me/447367061279";
const TELEGRAM_URL = "https://t.me/bulnix";

// ── Triage flow definition ────────────────────────────────────────────────────
type TriageStep = {
  id: string;
  bot: string;
  options?: { label: string; next: string }[];
  // If terminal=true, the step ends with a WhatsApp redirect using the collected summary
  terminal?: boolean;
};

const TRIAGE_FLOW: Record<string, TriageStep> = {
  start: {
    id: "start",
    bot: "Hi! 👋 I'm here to connect you with our support team on WhatsApp. To help them assist you faster, I'll ask a few quick questions first.\n\nWhat is your issue about?",
    options: [
      { label: "📦 My order / delivery", next: "order" },
      { label: "💳 Wallet top-up / payment", next: "payment" },
      { label: "🔄 Refund or wrong product", next: "refund" },
      { label: "🔑 Account / login issue", next: "account" },
      { label: "❓ Something else", next: "other" },
    ],
  },
  order: {
    id: "order",
    bot: "Got it — order issue. What best describes the problem?",
    options: [
      { label: "Order not delivered yet", next: "order_not_delivered" },
      { label: "Order shows fulfilled but I got nothing", next: "order_fulfilled_missing" },
      { label: "Wrong item delivered", next: "order_wrong_item" },
      { label: "Order is taking too long", next: "order_delayed" },
    ],
  },
  order_not_delivered: {
    id: "order_not_delivered",
    bot: "Understood. Do you have your order number handy?",
    options: [
      { label: "Yes, I have it", next: "order_has_ref" },
      { label: "No, I'll find it later", next: "order_no_ref" },
    ],
  },
  order_has_ref: {
    id: "order_has_ref",
    bot: "Perfect. Our team will ask you for it on WhatsApp. Ready to connect?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:Order not delivered — customer has order number" }],
  },
  order_no_ref: {
    id: "order_no_ref",
    bot: "No problem — you can find it in Dashboard → My Orders. Ready to connect to our team?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:Order not delivered — no order number yet" }],
  },
  order_fulfilled_missing: {
    id: "order_fulfilled_missing",
    bot: "This usually means the delivery details were sent to your email. Have you checked your inbox (including spam)?",
    options: [
      { label: "Yes, nothing there", next: "whatsapp:Order shows fulfilled but delivery details missing from email" },
      { label: "Let me check first", next: "check_email" },
    ],
  },
  check_email: {
    id: "check_email",
    bot: "Please check your registered email inbox and spam folder. If you still can't find it, our team will resend the details.",
    options: [{ label: "📱 Still can't find it — connect me", next: "whatsapp:Order fulfilled but delivery details not received in email" }],
  },
  order_wrong_item: {
    id: "order_wrong_item",
    bot: "Sorry about that! Our team will need your order number and a description of what you received. Ready to connect?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:Wrong item delivered" }],
  },
  order_delayed: {
    id: "order_delayed",
    bot: "Most orders complete within 30 minutes. If it's been over 1 hour, our team can investigate. Ready to connect?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:Order delayed — over 1 hour" }],
  },
  payment: {
    id: "payment",
    bot: "Wallet or payment issue — what happened?",
    options: [
      { label: "Payment deducted but wallet not credited", next: "payment_not_credited" },
      { label: "Payment failed / declined", next: "payment_failed" },
      { label: "I want to know how to top up", next: "topup_info" },
    ],
  },
  payment_not_credited: {
    id: "payment_not_credited",
    bot: "This can take up to 15 minutes. Have you waited at least 15 minutes since the payment?",
    options: [
      { label: "Yes, it's been over 15 minutes", next: "whatsapp:Payment deducted but wallet not credited after 15+ minutes" },
      { label: "No, I'll wait a bit more", next: "wait_payment" },
    ],
  },
  wait_payment: {
    id: "wait_payment",
    bot: "Please wait 15 minutes and check your Wallet page again. If it's still not credited, come back and we'll connect you to the team.",
    options: [{ label: "📱 Still not credited — connect me", next: "whatsapp:Payment deducted but wallet not credited" }],
  },
  payment_failed: {
    id: "payment_failed",
    bot: "Sorry about the failed payment. Our team can check the transaction. Do you have the payment reference or transaction ID?",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Payment failed — customer has transaction reference" },
      { label: "No, I'll find it", next: "whatsapp:Payment failed — no reference yet" },
    ],
  },
  topup_info: {
    id: "topup_info",
    bot: "To top up: go to Dashboard → Wallet → Top Up. You can pay via Flutterwave (card/bank), Kora Pay (NGN), or Crypto (min $10). Funds credit instantly after confirmation.",
    options: [
      { label: "That helped, thanks!", next: "done" },
      { label: "I still need help", next: "whatsapp:Top-up question" },
    ],
  },
  refund: {
    id: "refund",
    bot: "For refunds or product issues, what's the situation?",
    options: [
      { label: "Product doesn't work / invalid", next: "refund_invalid" },
      { label: "I want a refund to my wallet", next: "refund_wallet" },
      { label: "Charged twice", next: "refund_double" },
    ],
  },
  refund_invalid: {
    id: "refund_invalid",
    bot: "Our team will need your order number and details of the issue. Ready to connect?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:Product invalid or not working — refund request" }],
  },
  refund_wallet: {
    id: "refund_wallet",
    bot: "Refunds are processed back to your Bulnix wallet. Our team will review your order. Ready to connect?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:Refund request to wallet" }],
  },
  refund_double: {
    id: "refund_double",
    bot: "A double charge is urgent — please connect to our team right away with your payment references.",
    options: [{ label: "📱 Connect to WhatsApp now — urgent", next: "whatsapp:Double charge — urgent refund" }],
  },
  account: {
    id: "account",
    bot: "Account issue — what do you need help with?",
    options: [
      { label: "Forgot password", next: "account_password" },
      { label: "Can't log in", next: "whatsapp:Cannot log in to account" },
      { label: "Account suspended", next: "whatsapp:Account suspended" },
      { label: "Change email or name", next: "account_profile" },
    ],
  },
  account_password: {
    id: "account_password",
    bot: "You can reset your password from the login page — click \"Forgot Password\" and follow the steps. Did that help?",
    options: [
      { label: "Yes, sorted!", next: "done" },
      { label: "No, I need more help", next: "whatsapp:Password reset issue" },
    ],
  },
  account_profile: {
    id: "account_profile",
    bot: "To update your name or email, go to Dashboard → Profile Settings. Did that help?",
    options: [
      { label: "Yes, found it!", next: "done" },
      { label: "Still need help", next: "whatsapp:Profile update issue" },
    ],
  },
  other: {
    id: "other",
    bot: "No problem — our team can help with anything. Ready to connect to WhatsApp?",
    options: [{ label: "📱 Connect to WhatsApp now", next: "whatsapp:General enquiry" }],
  },
  done: {
    id: "done",
    bot: "Glad I could help! 😊 Is there anything else you need?",
    options: [
      { label: "No, I'm all good", next: "goodbye" },
      { label: "Yes, I have another issue", next: "start" },
    ],
  },
  goodbye: {
    id: "goodbye",
    bot: "Great! Have a wonderful day. If you ever need us, we're always here. 👋",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
type MsgRole = "bot" | "user";
interface Msg { id: number; role: MsgRole; text: string }
let _id = 0;
const mkMsg = (role: MsgRole, text: string): Msg => ({ id: ++_id, role, text });

// ── Component ─────────────────────────────────────────────────────────────────
type Panel = "menu" | "chat";

export default function SocialFloatingWidgets() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentStep, setCurrentStep] = useState<TriageStep>(TRIAGE_FLOW.start);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isOpen = panel !== null;

  // Init chat with greeting when opened
  useEffect(() => {
    if (panel === "chat" && messages.length === 0) {
      setMessages([mkMsg("bot", TRIAGE_FLOW.start.bot)]);
      setCurrentStep(TRIAGE_FLOW.start);
    }
  }, [panel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOption = (label: string, next: string) => {
    // Add user choice as message
    setMessages(prev => [...prev, mkMsg("user", label)]);

    if (next.startsWith("whatsapp:")) {
      const issue = next.replace("whatsapp:", "");
      const msg = encodeURIComponent(
        `Hi Bulnix Support! I need help with: ${issue}. Please assist me.`
      );
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg("bot",
          "Connecting you to our WhatsApp support team now. They'll be able to help you directly. 👇"
        )]);
        setTimeout(() => {
          window.open(`${WHATSAPP_BASE}?text=${msg}`, "_blank", "noopener,noreferrer");
        }, 800);
      }, 400);
      return;
    }

    const step = TRIAGE_FLOW[next];
    if (!step) return;
    setCurrentStep(step);
    setTimeout(() => {
      setMessages(prev => [...prev, mkMsg("bot", step.bot)]);
    }, 400);
  };

  const resetChat = () => {
    setMessages([]);
    setCurrentStep(TRIAGE_FLOW.start);
  };

  const close = () => { setPanel(null); };
  const toggle = () => setPanel(p => p === null ? "menu" : null);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── CHAT PANEL ── */}
      {panel === "chat" && (
        <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ width: 320, maxHeight: 480 }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0050D0] text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Bulnix Support</div>
              <div className="text-[11px] text-white/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Answer a few questions to connect
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetChat} className="text-white/60 hover:text-white text-[10px] px-2 py-0.5 rounded border border-white/20 hover:border-white/50 transition-colors">
                Reset
              </button>
              <button onClick={close} className="text-white/70 hover:text-white transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F8FAFF]" style={{ maxHeight: 300 }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-[#0050D0] text-white rounded-br-sm"
                    : "bg-white text-[#0D2137] shadow-sm border border-gray-100 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Quick reply options from current step */}
            {currentStep.options && messages.length > 0 && messages[messages.length - 1].role === "bot" && (
              <div className="flex flex-col gap-1.5 pt-1">
                {currentStep.options.map(opt => (
                  <button
                    key={opt.next}
                    onClick={() => handleOption(opt.label, opt.next)}
                    className="flex items-center justify-between gap-2 text-xs bg-white border border-[#0050D0]/25 text-[#0050D0] hover:bg-[#0050D0] hover:text-white rounded-xl px-3 py-2 transition-colors font-medium text-left"
                  >
                    <span>{opt.label}</span>
                    {opt.next.startsWith("whatsapp:")
                      ? <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      : <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />
                    }
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* ── MENU PANEL ── */}
      {panel === "menu" && (
        <div className="flex flex-col items-end gap-3 animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Live Chat / WhatsApp triage */}
          <button
            onClick={() => setPanel("chat")}
            className="flex items-center gap-3 group"
          >
            <span className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Live Support Chat
            </span>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 flex-shrink-0 bg-[#0050D0]">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Telegram */}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
            title="Join Telegram Channel"
          >
            <span className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Join Channel
            </span>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
              style={{ background: "#229ED9" }}
            >
              <Send className="w-5 h-5 text-white" />
            </div>
          </a>
        </div>
      )}

      {/* ── MAIN TOGGLE BUTTON with label ── */}
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap transition-all ${
          isOpen ? "bg-[#334155] text-white" : "bg-white border border-gray-200 text-gray-700"
        }`}>
          {isOpen ? "Close" : "Support"}
        </span>
        <button
          onClick={toggle}
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C2FF] flex-shrink-0"
          style={{
            background: isOpen ? "#334155" : "#00C2FF",
            boxShadow: "0 0 24px rgba(0,185,233,0.4)",
          }}
          aria-label={isOpen ? "Close support menu" : "Open support menu"}
        >
          {isOpen
            ? <X className="w-6 h-6 text-white" />
            : <MessageCircle className="w-6 h-6 text-white" />
          }
        </button>
      </div>
    </div>
  );
}
