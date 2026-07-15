"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Timeline", href: "/timeline", icon: "❖" },
  { label: "Journal", href: "/journal", icon: "✎" },
  { label: "Goals", href: "/goals", icon: "◎" },
  { label: "More", href: "/more", icon: "⋯" },
];

// "More" is active for any of its sub-rooms, not just /more itself.
const MORE_PATHS = ["/more", "/capsules", "/finance", "/travel", "/us"];

export function BottomNav() {
  const pathname = usePathname();
  const activeHref = MORE_PATHS.some((p) => pathname.startsWith(p))
    ? "/more"
    : TABS.find((t) => t.href !== "/" && pathname.startsWith(t.href))?.href ?? "/";

  return (
    <nav className="ss-bottom" aria-label="Main navigation">
      <div className="ss-bottom-inner">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`ss-tab ${activeHref === t.href ? "on" : ""}`}
            aria-current={activeHref === t.href ? "page" : undefined}
          >
            <i aria-hidden="true">{t.icon}</i>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
