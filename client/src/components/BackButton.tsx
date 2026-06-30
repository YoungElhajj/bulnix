import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface BackButtonProps {
  /** If provided, navigates to this href instead of history.back() */
  href?: string;
  /** Label shown next to the arrow. Defaults to "Back" */
  label?: string;
  /** Extra Tailwind classes */
  className?: string;
}

/**
 * Consistent back button used in every page hero header.
 * On mobile it is always visible and easy to tap (min-h-10).
 */
export default function BackButton({ href, label = "Back", className = "" }: BackButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 text-white/60 hover:text-[#00C2FF] text-sm transition-colors min-h-[40px] py-1 " +
    className;

  if (href) {
    return (
      <Link href={href}>
        <button className={base}>
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          {label}
        </button>
      </Link>
    );
  }

  return (
    <button onClick={() => window.history.back()} className={base}>
      <ChevronLeft className="w-4 h-4 flex-shrink-0" />
      {label}
    </button>
  );
}
