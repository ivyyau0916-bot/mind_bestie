import { Link, useRouterState } from "@tanstack/react-router";
import { User } from "lucide-react";

const items = [
  { to: "/chat", label: "Bestie傾訴", emoji: "💬" },
  { to: "/daily-card", label: "靈魂抽卡", emoji: "🔮" },
  { to: "/relaxation", label: "每日微光", emoji: "🌱" },
  { to: "/profile", label: "個人", icon: "user" as const },
] as const;

export const MAIN_TAB_PATHS = new Set<string>(items.map((item) => item.to));

export function isMainTabPath(pathname: string): boolean {
  return MAIN_TAB_PATHS.has(pathname);
}

const MAIN_PATHS = MAIN_TAB_PATHS;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!MAIN_PATHS.has(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div className="glass flex justify-around rounded-3xl py-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] text-muted-foreground transition-colors sm:text-xs"
            activeProps={{ className: "text-primary bg-secondary" }}
          >
            {"icon" in item && item.icon === "user" ? (
              <User className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <span className="text-lg leading-none sm:text-xl" aria-hidden="true">
                {"emoji" in item ? item.emoji : null}
              </span>
            )}
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-1 pb-3 pr-10 pt-[max(env(safe-area-inset-top),0.5rem)]">
      <h1 className="font-display text-2xl font-bold tracking-wide">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
