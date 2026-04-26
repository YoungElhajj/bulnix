/**
 * SocialFloatingWidgets
 * Floating support hub with:
 * - WhatsApp pre-triage chatbot (gathers full issue context before redirecting to WhatsApp)
 * - Telegram channel join button
 * - Email confirmation sent to user when triage is complete
 */
import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle, ChevronRight, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const WHATSAPP_BASE = "https://wa.me/447367061279";
const TELEGRAM_URL = "https://t.me/Bulnixlimited";  // Channel for updates
const TELEGRAM_SUPPORT_URL = "https://t.me/Bulnixlimited";  // Support DM

// ── Triage flow definition ────────────────────────────────────────────────────
type TriageStep = {
  id: string;
  bot: string;
  options?: { label: string; next: string }[];
};

const TRIAGE_FLOW: Record<string, TriageStep> = {
  start: {
    id: "start",
    bot: "Hi! 👋 Welcome to Bulnix Support.\n\nI'll ask a few quick questions to understand your issue, then connect you with the right support channel.\n\nWhat is your issue about?",
    options: [
      { label: "📦 My order / delivery", next: "order" },
      { label: "💳 Wallet top-up / payment", next: "payment" },
      { label: "🔄 Refund or wrong product", next: "refund" },
      { label: "🔑 Account / login issue", next: "account" },
      { label: "🏷️ Discount code / promo", next: "discount" },
      { label: "📦 Bulk order / reseller", next: "bulk" },
      { label: "❓ Something else", next: "other" },
    ],
  },

  // ── ORDER FLOW ───────────────────────────────────────────────────────────────
  order: {
    id: "order",
    bot: "Got it. What best describes your order issue?",
    options: [
      { label: "Order not delivered yet", next: "order_product" },
      { label: "Order shows fulfilled but I got nothing", next: "order_fulfilled_missing" },
      { label: "Wrong item delivered", next: "order_wrong_item_product" },
      { label: "Order is taking too long (1+ hour)", next: "order_delayed_product" },
      { label: "Partial delivery (only some items received)", next: "order_partial_product" },
      { label: "Product not working / invalid credentials", next: "order_not_working_product" },
    ],
  },
  order_product: {
    id: "order_product",
    bot: "Which product did you order? (e.g. Netflix Premium, Spotify, Instagram followers, etc.)",
    options: [
      { label: "Netflix / Streaming", next: "order_has_ref_streaming" },
      { label: "Social media (followers/likes/views)", next: "order_has_ref_social" },
      { label: "Gaming (gift cards / credits)", next: "order_has_ref_gaming" },
      { label: "Software / Accounts", next: "order_has_ref_software" },
      { label: "Other product", next: "order_has_ref_other" },
    ],
  },
  order_has_ref_streaming: {
    id: "order_has_ref_streaming",
    bot: "Got it — streaming product. Do you have your order number? (Find it in Dashboard → My Orders)",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Order not delivered — Streaming product — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Order not delivered — Streaming product — no order number yet" },
    ],
  },
  order_has_ref_social: {
    id: "order_has_ref_social",
    bot: "Got it — social media order. Do you have your order number?",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Order not delivered — Social media order — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Order not delivered — Social media order — no order number yet" },
    ],
  },
  order_has_ref_gaming: {
    id: "order_has_ref_gaming",
    bot: "Got it — gaming product. Do you have your order number?",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Order not delivered — Gaming product — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Order not delivered — Gaming product — no order number yet" },
    ],
  },
  order_has_ref_software: {
    id: "order_has_ref_software",
    bot: "Got it — software/account. Do you have your order number?",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Order not delivered — Software/Account — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Order not delivered — Software/Account — no order number yet" },
    ],
  },
  order_has_ref_other: {
    id: "order_has_ref_other",
    bot: "Understood. Do you have your order number? (Find it in Dashboard → My Orders)",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Order not delivered — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Order not delivered — no order number yet" },
    ],
  },
  order_fulfilled_missing: {
    id: "order_fulfilled_missing",
    bot: "This usually means the delivery details were sent to your registered email. Have you checked your inbox (including spam folder)?",
    options: [
      { label: "Yes, nothing there", next: "whatsapp:Order shows fulfilled but delivery details missing from email — checked spam" },
      { label: "Let me check first", next: "check_email" },
    ],
  },
  check_email: {
    id: "check_email",
    bot: "Please check your registered email inbox and spam/junk folder. Delivery emails sometimes land in spam. If you still can't find it, our team will resend the details.",
    options: [
      { label: "📱 Still can't find it — connect me", next: "whatsapp:Order fulfilled but delivery details not received — checked inbox and spam" },
    ],
  },
  order_wrong_item_product: {
    id: "order_wrong_item_product",
    bot: "Sorry about that! Which product did you order vs. what you received?",
    options: [
      { label: "Ordered streaming, got wrong one", next: "whatsapp:Wrong item delivered — ordered streaming product but received wrong one" },
      { label: "Ordered social media, got wrong one", next: "whatsapp:Wrong item delivered — ordered social media service but received wrong one" },
      { label: "Completely different product", next: "whatsapp:Wrong item delivered — completely different product received" },
    ],
  },
  order_delayed_product: {
    id: "order_delayed_product",
    bot: "Most orders complete within 30 minutes. Which product is delayed?",
    options: [
      { label: "Streaming account", next: "whatsapp:Order delayed 1+ hour — Streaming account" },
      { label: "Social media order", next: "whatsapp:Order delayed 1+ hour — Social media order" },
      { label: "Gaming / gift card", next: "whatsapp:Order delayed 1+ hour — Gaming/gift card" },
      { label: "Other", next: "whatsapp:Order delayed 1+ hour — other product" },
    ],
  },
  order_partial_product: {
    id: "order_partial_product",
    bot: "Partial delivery — sorry about that. What did you receive vs. what was missing?",
    options: [
      { label: "Received some accounts, missing others", next: "whatsapp:Partial delivery — received some accounts but missing others" },
      { label: "Received partial follower/view count", next: "whatsapp:Partial delivery — received partial social media count" },
      { label: "Other partial delivery", next: "whatsapp:Partial delivery — other" },
    ],
  },
  order_not_working_product: {
    id: "order_not_working_product",
    bot: "Sorry the product isn't working. What type of product is it?",
    options: [
      { label: "Streaming account (Netflix, Spotify, etc.)", next: "order_not_working_streaming" },
      { label: "Social media service", next: "whatsapp:Product not working — social media service — need order number" },
      { label: "Gaming / gift card", next: "whatsapp:Product not working — gaming/gift card — need order number" },
      { label: "Software / other account", next: "whatsapp:Product not working — software/account — need order number" },
    ],
  },
  order_not_working_streaming: {
    id: "order_not_working_streaming",
    bot: "For streaming accounts, have you tried logging in on a fresh browser or incognito mode?",
    options: [
      { label: "Yes, still not working", next: "whatsapp:Streaming account not working — tried incognito — need replacement" },
      { label: "No, let me try first", next: "try_incognito" },
    ],
  },
  try_incognito: {
    id: "try_incognito",
    bot: "Please try logging in using an incognito/private browser window. This resolves most streaming login issues. Come back if it still doesn't work.",
    options: [
      { label: "📱 Still not working — connect me", next: "whatsapp:Streaming account not working — tried incognito — still failing" },
      { label: "It worked! Thanks 🎉", next: "done" },
    ],
  },

  // ── PAYMENT FLOW ─────────────────────────────────────────────────────────────
  payment: {
    id: "payment",
    bot: "Wallet or payment issue — what happened?",
    options: [
      { label: "Payment deducted but wallet not credited", next: "payment_not_credited" },
      { label: "Payment failed / declined", next: "payment_failed" },
      { label: "How do I top up my wallet?", next: "topup_info" },
      { label: "Wrong amount credited", next: "whatsapp:Wrong amount credited to wallet — need transaction reference" },
      { label: "Crypto payment — waiting for confirmation", next: "payment_crypto" },
    ],
  },
  payment_not_credited: {
    id: "payment_not_credited",
    bot: "This can take up to 15 minutes. Have you waited at least 15 minutes since the payment?",
    options: [
      { label: "Yes, it's been over 15 minutes", next: "payment_not_credited_gateway" },
      { label: "No, I'll wait a bit more", next: "wait_payment" },
    ],
  },
  payment_not_credited_gateway: {
    id: "payment_not_credited_gateway",
    bot: "Which payment method did you use?",
    options: [
      { label: "Flutterwave (card/bank transfer)", next: "whatsapp:Payment deducted via Flutterwave but wallet not credited after 15+ minutes" },
      { label: "Kora Pay (NGN)", next: "whatsapp:Payment deducted via Kora Pay but wallet not credited after 15+ minutes" },
      { label: "Crypto (NowPayments)", next: "payment_crypto_wait" },
    ],
  },
  payment_crypto_wait: {
    id: "payment_crypto_wait",
    bot: "Crypto payments can take 10–60 minutes depending on network congestion. Have you waited at least 1 hour?",
    options: [
      { label: "Yes, over 1 hour", next: "whatsapp:Crypto payment sent but wallet not credited after 1+ hour — need transaction hash" },
      { label: "No, I'll wait more", next: "wait_crypto" },
    ],
  },
  wait_crypto: {
    id: "wait_crypto",
    bot: "Crypto confirmations can take up to 1 hour. Please check your NowPayments confirmation email for the transaction status. Come back if it's still pending after 1 hour.",
    options: [
      { label: "📱 Still pending after 1 hour — connect me", next: "whatsapp:Crypto payment still pending after 1 hour — need transaction hash" },
    ],
  },
  wait_payment: {
    id: "wait_payment",
    bot: "Please wait 15 minutes and check your Wallet page again. If it's still not credited, come back and we'll connect you to the team.",
    options: [
      { label: "📱 Still not credited — connect me", next: "whatsapp:Payment deducted but wallet not credited" },
    ],
  },
  payment_failed: {
    id: "payment_failed",
    bot: "Sorry about the failed payment. Which method failed?",
    options: [
      { label: "Card payment (Flutterwave)", next: "payment_failed_card" },
      { label: "Bank transfer (Kora Pay)", next: "whatsapp:Bank transfer payment failed via Kora Pay — need transaction reference" },
      { label: "Crypto payment", next: "whatsapp:Crypto payment failed — need transaction hash" },
    ],
  },
  payment_failed_card: {
    id: "payment_failed_card",
    bot: "Card failures are usually due to insufficient funds, 3DS verification, or bank restrictions. Have you tried a different card?",
    options: [
      { label: "Yes, all cards fail", next: "whatsapp:Card payment consistently failing — tried multiple cards" },
      { label: "No, let me try another card", next: "done" },
      { label: "I want a refund for the failed charge", next: "whatsapp:Card payment failed but amount was deducted — need refund" },
    ],
  },
  payment_crypto: {
    id: "payment_crypto",
    bot: "Crypto payments require blockchain confirmations which can take 10–60 minutes. Have you received a NowPayments confirmation email?",
    options: [
      { label: "Yes, email says confirmed but wallet empty", next: "whatsapp:Crypto confirmed by NowPayments but wallet not credited" },
      { label: "No confirmation email yet", next: "wait_crypto" },
    ],
  },
  topup_info: {
    id: "topup_info",
    bot: "To top up your wallet:\n1. Go to Dashboard → Wallet → Top Up\n2. Choose your payment method:\n   • Flutterwave — card or bank transfer (USD)\n   • Kora Pay — NGN bank transfer (min ₦500)\n   • Crypto — USDT/TRC20 (min $10)\n3. Follow the payment instructions\n\nFunds credit instantly after confirmation.",
    options: [
      { label: "That helped, thanks!", next: "done" },
      { label: "I still need help", next: "whatsapp:Top-up question — needs manual assistance" },
    ],
  },

  // ── REFUND FLOW ──────────────────────────────────────────────────────────────
  refund: {
    id: "refund",
    bot: "For refunds or product issues, what's the situation?",
    options: [
      { label: "Product doesn't work / invalid", next: "refund_invalid_product" },
      { label: "I want a refund to my wallet", next: "refund_wallet" },
      { label: "Charged twice for same order", next: "refund_double" },
      { label: "Order cancelled — want refund", next: "refund_cancelled" },
      { label: "Received wrong product — want refund", next: "refund_wrong" },
    ],
  },
  refund_invalid_product: {
    id: "refund_invalid_product",
    bot: "Which product type is invalid?",
    options: [
      { label: "Streaming account (wrong password / banned)", next: "whatsapp:Streaming account invalid/banned — refund request — need order number" },
      { label: "Social media — service not delivered", next: "whatsapp:Social media service not delivered — refund request — need order number" },
      { label: "Gaming / gift card — code not working", next: "whatsapp:Gift card/gaming code not working — refund request — need order number" },
      { label: "Other product", next: "whatsapp:Product invalid — refund request — need order number" },
    ],
  },
  refund_wallet: {
    id: "refund_wallet",
    bot: "Refunds are processed back to your Bulnix wallet balance within 24 hours after review. Our team will need your order number. Ready to connect?",
    options: [
      { label: "📱 Connect to WhatsApp now", next: "whatsapp:Refund request to wallet — need order number" },
    ],
  },
  refund_double: {
    id: "refund_double",
    bot: "A double charge is urgent. Please have both payment references ready. Our team will process the refund immediately.",
    options: [
      { label: "📱 Connect to WhatsApp now — urgent", next: "whatsapp:Double charge — urgent refund — need both payment references" },
    ],
  },
  refund_cancelled: {
    id: "refund_cancelled",
    bot: "For cancelled order refunds, the amount is returned to your Bulnix wallet. Do you have your order number?",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Cancelled order refund — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Cancelled order refund — no order number yet" },
    ],
  },
  refund_wrong: {
    id: "refund_wrong",
    bot: "Sorry about the wrong product. Our team will arrange a replacement or refund. Do you have your order number?",
    options: [
      { label: "Yes, I have it", next: "whatsapp:Wrong product received — refund or replacement — customer has order number" },
      { label: "No, I'll find it", next: "whatsapp:Wrong product received — refund or replacement — no order number" },
    ],
  },

  // ── ACCOUNT FLOW ─────────────────────────────────────────────────────────────
  account: {
    id: "account",
    bot: "Account issue — what do you need help with?",
    options: [
      { label: "Forgot password", next: "account_password" },
      { label: "Can't log in (not password issue)", next: "account_login_issue" },
      { label: "Account suspended or banned", next: "whatsapp:Account suspended — need urgent review" },
      { label: "Change email address", next: "account_change_email" },
      { label: "Update name or profile", next: "account_profile" },
      { label: "Delete my account", next: "whatsapp:Account deletion request" },
      { label: "Two-factor authentication issue", next: "whatsapp:2FA / OTP issue — cannot receive code" },
    ],
  },
  account_password: {
    id: "account_password",
    bot: "You can reset your password directly from the login page:\n1. Go to bulnix.com/login\n2. Click \"Forgot password?\"\n3. Enter your email and follow the reset link\n\nDid that help?",
    options: [
      { label: "Yes, sorted! ✅", next: "done" },
      { label: "I didn't receive the reset email", next: "whatsapp:Password reset email not received — check spam or need manual reset" },
      { label: "Link expired / not working", next: "whatsapp:Password reset link expired or not working" },
    ],
  },
  account_login_issue: {
    id: "account_login_issue",
    bot: "What happens when you try to log in?",
    options: [
      { label: "\"Invalid credentials\" error", next: "whatsapp:Login error: invalid credentials — may need password reset" },
      { label: "OTP code not arriving", next: "whatsapp:OTP/verification code not received — check spam or need resend" },
      { label: "Page keeps loading / error", next: "whatsapp:Login page technical error — need screenshot" },
    ],
  },
  account_change_email: {
    id: "account_change_email",
    bot: "To change your email, our team needs to verify your identity first for security. Ready to connect?",
    options: [
      { label: "📱 Connect to WhatsApp now", next: "whatsapp:Email change request — identity verification needed" },
    ],
  },
  account_profile: {
    id: "account_profile",
    bot: "To update your name or profile, go to Dashboard → Profile Settings. Did that help?",
    options: [
      { label: "Yes, found it! ✅", next: "done" },
      { label: "Still need help", next: "whatsapp:Profile update issue — cannot find settings" },
    ],
  },

  // ── DISCOUNT / PROMO FLOW ────────────────────────────────────────────────────
  discount: {
    id: "discount",
    bot: "Discount code or promo issue — what's the problem?",
    options: [
      { label: "Code not working at checkout", next: "discount_not_working" },
      { label: "Code expired", next: "whatsapp:Discount code expired — requesting valid code" },
      { label: "I want a discount code", next: "discount_request" },
      { label: "Referral bonus not credited", next: "whatsapp:Referral bonus not credited — need referral details" },
    ],
  },
  discount_not_working: {
    id: "discount_not_working",
    bot: "Discount codes are case-sensitive and may have minimum order requirements. Have you checked the code is entered exactly as given?",
    options: [
      { label: "Yes, entered correctly — still fails", next: "whatsapp:Discount code not working — entered correctly — need manual check" },
      { label: "Let me double-check", next: "done" },
    ],
  },
  discount_request: {
    id: "discount_request",
    bot: "We regularly share exclusive discount codes on our Telegram channel and social media. Have you joined our Telegram channel?",
    options: [
      { label: "Join Telegram for codes 📢", next: "telegram_redirect" },
      { label: "I need a code urgently", next: "whatsapp:Requesting discount code — urgent" },
    ],
  },
  telegram_redirect: {
    id: "telegram_redirect",
    bot: "Join our Telegram channel @Bulnixlimited for exclusive deals, discount codes, and order updates! Click the button below to join.",
    options: [
      { label: "📢 Join @Bulnixlimited Channel", next: "telegram_channel" },
      { label: "I need a code urgently", next: "whatsapp:Requesting discount code — urgent" },
    ],
  },
  telegram_channel: {
    id: "telegram_channel",
    bot: "Opening the Bulnix Telegram channel now. You can find all our discount codes and exclusive deals there. Is there anything else I can help you with?",
    options: [
      { label: "No, that's all ✅", next: "done" },
      { label: "I still need a code", next: "whatsapp:Requesting discount code — checked Telegram — need manual code" },
    ],
  },

  // ── BULK ORDER FLOW ──────────────────────────────────────────────────────────
  bulk: {
    id: "bulk",
    bot: "Bulk order or reseller enquiry — what do you need?",
    options: [
      { label: "Bulk pricing for streaming accounts", next: "whatsapp:Bulk order enquiry — streaming accounts — need pricing" },
      { label: "Bulk social media services", next: "whatsapp:Bulk order enquiry — social media services — need pricing" },
      { label: "Reseller / wholesale account", next: "whatsapp:Reseller/wholesale account enquiry" },
      { label: "Custom order (not listed)", next: "whatsapp:Custom bulk order enquiry — not in catalogue" },
    ],
  },

  // ── OTHER ────────────────────────────────────────────────────────────────────
  other: {
    id: "other",
    bot: "No problem — our team can help with anything. What's the topic?",
    options: [
      { label: "Product availability question", next: "whatsapp:Product availability enquiry" },
      { label: "Delivery format / how it works", next: "delivery_info" },
      { label: "Partnership / collaboration", next: "whatsapp:Partnership or collaboration enquiry" },
      { label: "Something else entirely", next: "whatsapp:General enquiry — other" },
    ],
  },
  delivery_info: {
    id: "delivery_info",
    bot: "Delivery info:\n• Streaming accounts — login details sent to your email within 30 minutes\n• Social media (followers/views) — starts within 1–24 hours depending on the service\n• Gift cards — code sent to email within 30 minutes\n\nAll delivery details go to your registered email. Did that answer your question?",
    options: [
      { label: "Yes, thanks! ✅", next: "done" },
      { label: "I have more questions", next: "whatsapp:Delivery format question — needs more detail" },
    ],
  },

  // ── TERMINAL STATES ──────────────────────────────────────────────────────────
  done: {
    id: "done",
    bot: "Glad I could help! 😊 Is there anything else you need?",
    options: [
      { label: "No, I'm all good 👍", next: "goodbye" },
      { label: "Yes, I have another issue", next: "start" },
    ],
  },
  goodbye: {
    id: "goodbye",
    bot: "Great! Have a wonderful day. If you ever need us, we're always here. 👋\n\nYou can also find us on Telegram for updates and deals.",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
type MsgRole = "bot" | "user";
interface Msg { id: number; role: MsgRole; text: string }
let _id = 0;
const mkMsg = (role: MsgRole, text: string): Msg => ({ id: ++_id, role, text });

/**
 * Builds a rich pre-filled Telegram support message from the user's triage answers.
 * Format: "Hello Bulnix Support 👋\n\nI need help with: [issue]\n\nMy answers:\n1. ..."
 */
function buildSupportMessage(
  user: { name?: string | null; email?: string | null } | null | undefined,
  issue: string,
  history: string[]
): string {
  const greeting = user?.name ? `Hello Bulnix Support 👋, my name is ${user.name}` : "Hello Bulnix Support 👋";
  const emailLine = user?.email ? `\nEmail: ${user.email}` : "";
  const steps = history.length > 0
    ? `\n\nMy answers:\n${history.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    : "";
  const raw = `${greeting}${emailLine}\n\nI need help with: ${issue}${steps}\n\nPlease assist me. Thank you!`;
  return encodeURIComponent(raw);
}

// ── Component ─────────────────────────────────────────────────────────────────
type Panel = "menu" | "chat";

interface SocialFloatingWidgetsProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function SocialFloatingWidgets({ forceOpen, onClose }: SocialFloatingWidgetsProps = {}) {
  const [panel, setPanel] = useState<Panel | null>(forceOpen ? "chat" : null);

  // Sync forceOpen prop
  useEffect(() => {
    if (forceOpen) setPanel("chat");
  }, [forceOpen]);
  const [telegramMode, setTelegramMode] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentStep, setCurrentStep] = useState<TriageStep>(TRIAGE_FLOW.start);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const submitTriage = trpc.support.submitTriage.useMutation();

  const isOpen = panel !== null;

  // Init chat with greeting when opened
  useEffect(() => {
    if (panel === "chat" && messages.length === 0) {
      setMessages([mkMsg("bot", TRIAGE_FLOW.start.bot)]);
      setCurrentStep(TRIAGE_FLOW.start);
      setStepHistory([]);
    }
  }, [panel, telegramMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleOption = (label: string, next: string) => {
    setMessages(prev => [...prev, mkMsg("user", label)]);
    const newHistory = [...stepHistory, label];
    setStepHistory(newHistory);

    if (next.startsWith("whatsapp:")) {
      const issue = next.replace("whatsapp:", "");
      if (telegramMode) {
        // In Telegram mode, build a rich pre-filled Telegram message from all triage answers
        const tgMsg = buildSupportMessage(user, issue, newHistory);
        setTimeout(() => {
          setMessages(prev => [...prev, mkMsg("bot",
            "Connecting you to our Telegram support now. They already have your issue summary. 👇"
          )]);
          setCurrentStep({ id: "__done__", bot: "", options: [] });
          if (user?.email) {
            submitTriage.mutate({ email: user.email, name: user.name || undefined, issueSummary: issue, steps: newHistory });
          }
          setTimeout(() => {
            window.open(`https://t.me/Bulnixlimited?text=${tgMsg}`, "_blank", "noopener,noreferrer");
          }, 800);
        }, 400);
        return;
      }
      // Show channel choice step instead of immediately redirecting
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg("bot",
          "Great, I have all the details I need. How would you like to contact our support team?"
        )]);
        setCurrentStep({
          id: "__channel_choice__",
          bot: "Great, I have all the details I need. How would you like to contact our support team?",
          options: [
            { label: "💬 WhatsApp", next: `__wa__:${issue}` },
            { label: "✈️ Telegram", next: `__tg__:${issue}` },
          ],
        });
      }, 400);
      return;
    }
    if (next.startsWith("__wa__:")) {
      const issue = next.replace("__wa__:", "");
      const msg = encodeURIComponent(
        `Hi Bulnix Support! 👋\n\nI need help with: *${issue}*\n\nMy answers:\n${newHistory.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nPlease assist me. Thank you!`
      );
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg("bot",
          "Connecting you to our WhatsApp support team now. They already have your issue summary. 👇\n\nYou will also receive a confirmation email if you are signed in."
        )]);
        if (user?.email) {
          submitTriage.mutate({
            email: user.email,
            name: user.name || undefined,
            issueSummary: issue,
            steps: newHistory,
          });
        }
        setTimeout(() => {
          window.open(`${WHATSAPP_BASE}?text=${msg}`, "_blank", "noopener,noreferrer");
        }, 800);
      }, 400);
      return;
    }
    if (next.startsWith("__tg__:")) {
      const issue = next.replace("__tg__:", "");
      const tgMsg = buildSupportMessage(user, issue, newHistory);
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg("bot",
          "Connecting you to our Telegram support now. They already have your issue summary. 👇"
        )]);
        if (user?.email) {
          submitTriage.mutate({
            email: user.email,
            name: user.name || undefined,
            issueSummary: issue,
            steps: newHistory,
          });
        }
        setTimeout(() => {
          window.open(`https://t.me/Bulnixlimited?text=${tgMsg}`, "_blank", "noopener,noreferrer");
        }, 800);
      }, 400);
      return;
    }
        if (next === "telegram_channel") {
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg("bot", TRIAGE_FLOW.telegram_channel.bot)]);
        setCurrentStep(TRIAGE_FLOW.telegram_channel);
        setTimeout(() => {
          window.open(TELEGRAM_URL, "_blank", "noopener,noreferrer");
        }, 600);
      }, 400);
      return;
    }
    if (next.startsWith("telegram:")) {
      const issue = next.replace("telegram:", "");
      const tgMsg = buildSupportMessage(user, issue, newHistory);
      setTimeout(() => {
        setMessages(prev => [...prev, mkMsg("bot",
          "Connecting you to our Telegram support now. They already have your issue summary. 👇"
        )]);
        setTimeout(() => {
          window.open(`https://t.me/Bulnixlimited?text=${tgMsg}`, "_blank", "noopener,noreferrer");
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
    setStepHistory([]);
  };

  const close = () => { setPanel(null); onClose?.(); };
  const toggle = () => { if (panel !== null) setTelegramMode(false); setPanel(p => p === null ? "menu" : null); };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">

      {/* ── CHAT PANEL ── */}
      {panel === "chat" && (
        <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ width: 'min(320px, calc(100vw - 2rem))', maxHeight: 500 }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0050D0] text-white flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Bulnix Support</div>
              <div className="text-[10px] text-white/70 leading-tight">
                Answer a few questions to get connected
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
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F8FAFF]" style={{ maxHeight: 340 }}>
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
                    {(opt.next.startsWith("whatsapp:") || opt.next.startsWith("telegram:"))
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
            onClick={() => { setTelegramMode(false); setPanel("chat"); }}
            className="flex items-center gap-3 group"
          >
            <span className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Live Support Chat
            </span>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 flex-shrink-0 bg-[#0050D0]">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Telegram Support - opens triage chat in Telegram mode */}
          <button
            onClick={() => {
              setTelegramMode(true);
              setMessages([mkMsg("bot", TRIAGE_FLOW.start.bot)]);
              setCurrentStep(TRIAGE_FLOW.start);
              setStepHistory([]);
              setPanel("chat");
            }}
            className="flex items-center gap-3 group"
            title="Chat on Telegram"
          >
            <span className="bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
              Telegram Support
            </span>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
              style={{ background: "#229ED9" }}
            >
              <Send className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Join Telegram Channel */}
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
              style={{ background: "#1a6e9e" }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
          </a>
        </div>
      )}

      {/* ── MAIN TOGGLE BUTTON with label ── */}
      <div className="flex items-center gap-2">
        {!isOpen && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap bg-white border border-[#00C2FF]/30 text-[#0050D0] animate-bounce">
            💬 Need Help?
          </span>
        )}
        {isOpen && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap bg-[#334155] text-white">
            Close
          </span>
        )}
        <button
          onClick={toggle}
          className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00C2FF] flex-shrink-0"
          style={{
            background: isOpen ? "#334155" : "linear-gradient(135deg, #00C2FF 0%, #0050D0 100%)",
            boxShadow: isOpen ? "0 4px 16px rgba(0,0,0,0.3)" : "0 0 0 0 rgba(0,194,255,0.4)",
          }}
          aria-label={isOpen ? "Close support menu" : "Open support menu"}
        >
          {!isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping bg-[#00C2FF] opacity-30"></span>
          )}
          {isOpen
            ? <X className="w-7 h-7 text-white" />
            : <MessageCircle className="w-7 h-7 text-white" />
          }
        </button>
      </div>
    </div>
  );
}
