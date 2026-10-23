import type { CSSProperties } from "react";
import type { SelfCareIconId } from "@/lib/self-care-checkin";
import { cn } from "@/lib/utils";

const SPARKLE_OFFSETS = [
  { tx: "-1.1rem", ty: "-1.4rem", delay: "0ms" },
  { tx: "1.2rem", ty: "-1.2rem", delay: "40ms" },
  { tx: "-1.3rem", ty: "0.6rem", delay: "80ms" },
  { tx: "1.1rem", ty: "0.8rem", delay: "120ms" },
  { tx: "0rem", ty: "-1.6rem", delay: "60ms" },
];

export type FlyingGlowParticle = {
  id: number;
  fromX: number;
  fromY: number;
  dx: number;
  dy: number;
  targetGlowSteps: number;
};

export function SelfCareFlyingGlowLayer({
  particles,
  onParticleLand,
}: {
  particles: FlyingGlowParticle[];
  onParticleLand: (particle: FlyingGlowParticle) => void;
}) {
  if (particles.length === 0) return null;
  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="self-care-flying-glow pointer-events-none fixed z-50 size-3 rounded-full"
          style={
            {
              left: p.fromX,
              top: p.fromY,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
            } as CSSProperties
          }
          onAnimationEnd={() => onParticleLand(p)}
          aria-hidden
        />
      ))}
    </>
  );
}

export function SelfCareSparkleBurst({ token }: { token: number }) {
  if (token <= 0) return null;
  return (
    <span key={token} className="pointer-events-none absolute inset-0" aria-hidden>
      {SPARKLE_OFFSETS.map((s, i) => (
        <span
          key={i}
          className="self-care-sparkle-particle absolute left-1/2 top-1/2 size-1.5 rounded-full bg-amber-200/90 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          style={
            {
              "--tx": s.tx,
              "--ty": s.ty,
              animationDelay: s.delay,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function IconPaths({ id }: { id: SelfCareIconId }) {
  switch (id) {
    case "droplet":
      return (
        <path
          d="M12 3c2.5 4 6 8.2 6 11.5A6 6 0 0 1 6 18.5C6 11.2 9.5 7 12 3z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
      );
    case "cloud":
      return (
        <path
          d="M7 14h10a3 3 0 0 0 .4-6A4.5 4.5 0 0 0 7.5 6 4 4 0 0 0 4 13.2"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "heart":
      return (
        <path
          d="M12 20s-7-4.4-7-9.2A4.2 4.2 0 0 1 12 8.5 4.2 4.2 0 0 1 19 10.8C19 15.6 12 20 12 20z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
      );
    case "leaf":
      return (
        <path
          d="M12 4C7 8 5 12 5 16a7 7 0 0 0 14 0c0-4-2-8-7-12z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
        />
      );
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </>
      );
    case "feather":
      return (
        <path
          d="M6 18c6-1 10-5 12-12M8 16l8-8M10 14l2-2"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "message":
      return (
        <path
          d="M5 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 3V8a2 2 0 0 1 2-2z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
      );
    case "walk":
      return (
        <>
          <circle cx="13" cy="5" r="1.6" fill="currentColor" />
          <path d="M10 21v-5l-2-3 3-1 2 4 3-1v6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "note":
      return (
        <>
          <path d="M9 18V6l8-2v12" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </>
      );
    case "music":
      return (
        <>
          <path d="M9 18V7l9-2v11" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <circle cx="7" cy="18" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
          <circle cx="16" cy="16" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </>
      );
    case "moon":
      return (
        <path
          d="M20 13a7.5 7.5 0 1 1-9-9 6.5 6.5 0 0 0 9 9z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinejoin="round"
        />
      );
    default:
      return (
        <path
          d="M12 3l1.2 3.6L17 8l-3.6 1.2L12 13l-1.2-3.8L7 8l3.8-1.4L12 3z"
          stroke="currentColor"
          strokeWidth="1.3"
          fill="none"
          strokeLinejoin="round"
        />
      );
  }
}

export function SelfCareTaskIcon({ icon, done }: { icon: SelfCareIconId; done: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-500",
        done
          ? "border-amber-200/80 bg-gradient-to-br from-rose-100/90 to-amber-100/80 text-amber-700 shadow-[0_0_14px_rgba(251,191,36,0.35)] dark:border-amber-500/30 dark:from-rose-950/40 dark:to-amber-950/30 dark:text-amber-200"
          : "border-stone-200/70 bg-stone-100/45 text-stone-500 dark:border-stone-600/40 dark:bg-stone-800/40 dark:text-stone-400",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[1.05rem]" aria-hidden>
        <IconPaths id={icon} />
      </svg>
    </span>
  );
}
