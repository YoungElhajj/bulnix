/**
 * Bulnix Spending Tier / Badge System
 * Tiers are based on total USD spent (wallet.totalSpent)
 */

export type Tier = {
  name: string;
  minSpend: number; // USD
  maxSpend: number | null; // null = unlimited
  color: string; // Tailwind color class
  bgColor: string;
  borderColor: string;
  emoji: string;
  description: string;
};

export const TIERS: Tier[] = [
  {
    name: "Bronze",
    minSpend: 0,
    maxSpend: 49.99,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    emoji: "🥉",
    description: "Welcome to Bulnix! Keep shopping to level up.",
  },
  {
    name: "Silver",
    minSpend: 50,
    maxSpend: 199.99,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    emoji: "🥈",
    description: "Silver member. You are building up great loyalty.",
  },
  {
    name: "Gold",
    minSpend: 200,
    maxSpend: 499.99,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-400",
    emoji: "🥇",
    description: "Gold member. Thank you for your continued support.",
  },
  {
    name: "Platinum",
    minSpend: 500,
    maxSpend: 999.99,
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-400",
    emoji: "💎",
    description: "Platinum member. You are among our top customers.",
  },
  {
    name: "Diamond",
    minSpend: 1000,
    maxSpend: null,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-400",
    emoji: "👑",
    description: "Diamond member. You are a Bulnix VIP. Thank you!",
  },
];

export function getUserTier(totalSpentUSD: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (totalSpentUSD >= TIERS[i].minSpend) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

export function getNextTier(totalSpentUSD: number): Tier | null {
  const current = getUserTier(totalSpentUSD);
  const idx = TIERS.findIndex((t) => t.name === current.name);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function getProgressToNextTier(totalSpentUSD: number): number {
  const current = getUserTier(totalSpentUSD);
  const next = getNextTier(totalSpentUSD);
  if (!next) return 100;
  const range = next.minSpend - current.minSpend;
  const progress = totalSpentUSD - current.minSpend;
  return Math.min(100, Math.round((progress / range) * 100));
}
