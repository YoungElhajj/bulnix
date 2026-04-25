import { createContext, useContext, useState, ReactNode } from "react";

export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD" },
  { code: "NGN", symbol: "₦", label: "NGN" },
  { code: "EUR", symbol: "€", label: "EUR" },
  { code: "GBP", symbol: "£", label: "GBP" },
];

export const RATES: Record<string, number> = { USD: 1, NGN: 1600, EUR: 0.92, GBP: 0.79 };

export function formatPrice(usd: number, currency: string): string {
  const cur = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];
  const converted = usd * (RATES[currency] ?? 1);
  if (currency === "NGN") return `${cur.symbol}${converted.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
  return `${cur.symbol}${converted.toFixed(2)}`;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  formatPrice: (usd: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  formatPrice: (usd) => `$${usd.toFixed(2)}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem("bulnix_currency") ?? "USD";
  });

  const setCurrency = (c: string) => {
    localStorage.setItem("bulnix_currency", c);
    setCurrencyState(c);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice: (usd: number) => formatPrice(usd, currency),
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
