"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Link2 } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/connect", label: "Connect", icon: Link2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 shadow-lg pb-[var(--safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex flex-row items-center justify-around px-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = label === "Home"
            ? pathname === "/" || pathname === "/inspect"
            : pathname === "/connect";
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 px-2 min-h-[44px] min-w-[64px] py-2 rounded-md transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={`px-4 py-1.5 flex items-center justify-center ${
                  isActive ? "bg-primary/10 rounded-full" : ""
                }`}
              >
                <Icon className="size-6 flex-shrink-0" aria-hidden />
              </div>
              <span className="text-xs font-medium truncate max-w-[88px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
