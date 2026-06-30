import { Copy, Key } from "lucide-react";
import { toast } from "sonner";

const FIELD_LABELS: Record<string, string> = {
  login: "Username / Login",
  username: "Username",
  email: "Email",
  password: "Password",
  email_password: "Email Password",
  "2fa": "2FA Key",
  "2fa_key": "2FA Key",
  totp: "2FA Key",
  backup_codes: "Backup Codes",
  token: "Token",
  id: "Account ID",
  facebook_id: "Facebook ID",
  data: "Data",
  credential: "Credential",
  phone: "Phone Number",
  recovery_email: "Recovery Email",
  recovery_password: "Recovery Password",
};

function labelKey(key: string): string {
  return FIELD_LABELS[key.toLowerCase()] ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function parseColonString(line: string): Record<string, string> {
  const parts = line.split(":").map(part => part.trim());
  if (parts.length === 1) return { credential: parts[0] };

  const fieldMaps: Record<number, string[]> = {
    2: ["login", "password"],
    3: ["email", "password", "email_password"],
    4: ["email", "password", "recovery_email", "recovery_password"],
    5: ["login", "password", "email", "recovery_password", "backup_codes"],
    6: ["login", "password", "email", "recovery_password", "backup_codes", "data"],
  };

  const keys = fieldMaps[parts.length] ?? parts.map((_, index) => `field_${index + 1}`);
  const result: Record<string, string> = {};

  parts.forEach((value, index) => {
    if (value) result[keys[index] ?? `field_${index + 1}`] = value;
  });

  return result;
}

export function parseCredentialData(raw: unknown): Array<Record<string, string>> {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.flatMap(item => parseCredentialData(item));
  }

  if (typeof raw === "object") {
    const entries = Object.entries(raw as Record<string, unknown>).filter(([, value]) => value !== null && value !== undefined && value !== "");
    return entries.length > 0 ? [Object.fromEntries(entries.map(([key, value]) => [key, String(value)]))] : [];
  }

  const text = String(raw).trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return parseCredentialData(parsed);
  } catch {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => (line.includes(":") ? parseColonString(line) : { credential: line }));
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export function CredentialCards({ raw, className = "" }: { raw: unknown; className?: string }) {
  const accounts = parseCredentialData(raw);

  if (accounts.length === 0) {
    return (
      <div className={`rounded-xl border border-slate-800 bg-[#0d1117] px-4 py-3 text-xs text-slate-400 ${className}`}>
        No delivered credentials found.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {accounts.map((account, index) => {
        const entries = Object.entries(account).filter(([, value]) => value);
        const fullText = entries.map(([key, value]) => `${labelKey(key)}: ${value}`).join("\n");

        return (
          <div key={`${index}-${fullText}`} className="rounded-xl border border-emerald-900/30 bg-[#0d1117] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Key className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-emerald-400">Credential #{index + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(fullText)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Copy className="h-3 w-3" /> Copy All
              </button>
            </div>

            <div className="space-y-2">
              {entries.map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1 rounded-lg border border-emerald-900/20 bg-[#161b22] px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
                  <span className="min-w-[140px] text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {labelKey(key)}
                  </span>
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <span className="flex-1 break-all font-mono text-xs leading-relaxed text-white">{value}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(value)}
                      className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                      title={`Copy ${labelKey(key)}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
