import type { Weather } from "@/lib/mood-store";

export function WeatherIcon({ weather, className = "size-10" }: { weather: Weather; className?: string }) {
  const cloud = (fill: string) => (
    <path d="M18 44a10 10 0 0 1 1-20 14 14 0 0 1 27 4 8 8 0 0 1 0 16Z" fill={fill} />
  );
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label={weather}>
      {weather === "sunny" && (
        <g>
          <g stroke="var(--amber)" strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4;
              return <line key={i} x1={32 + Math.cos(a) * 18} y1={32 + Math.sin(a) * 18} x2={32 + Math.cos(a) * 26} y2={32 + Math.sin(a) * 26} />;
            })}
          </g>
          <circle cx="32" cy="32" r="12" fill="var(--amber)" />
        </g>
      )}
      {weather === "cloudy" && (
        <g>
          <circle cx="40" cy="22" r="9" fill="var(--amber)" opacity="0.9" />
          {cloud("var(--sky)")}
        </g>
      )}
      {weather === "rainy" && (
        <g>
          <g transform="translate(0,-6)">{cloud("var(--sky)")}</g>
          <g stroke="var(--sky)" strokeWidth="3" strokeLinecap="round">
            <line x1="22" y1="44" x2="19" y2="54" />
            <line x1="32" y1="44" x2="29" y2="56" />
            <line x1="42" y1="44" x2="39" y2="54" />
          </g>
        </g>
      )}
      {weather === "storm" && (
        <g>
          <g transform="translate(0,-6)">{cloud("var(--storm)")}</g>
          <path d="M34 38 26 50h7l-4 10 11-14h-7l4-8Z" fill="var(--amber)" />
        </g>
      )}
    </svg>
  );
}
