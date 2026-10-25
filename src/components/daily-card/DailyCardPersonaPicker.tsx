import { Lock } from "lucide-react";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { isPersonaId, PERSONAS, type PersonaId } from "@/lib/chat-personas";
import { getDailyCardPersonaTheme, dailyCardThemeTransitionClass } from "@/lib/daily-card-persona-theme";
import { isPersonaUnlocked } from "@/lib/freemium";
import { cn } from "@/lib/utils";

type DailyCardPersonaPickerProps = {
  persona: PersonaId;
  isVip: boolean;
  createdAt?: string | null;
  disabled?: boolean;
  onSelect: (persona: PersonaId) => void;
  onLockedSelect: () => void;
};

export function DailyCardPersonaPicker({
  persona,
  isVip,
  createdAt,
  disabled,
  onSelect,
  onLockedSelect,
}: DailyCardPersonaPickerProps) {
  return (
    <div
      className="relative z-10 mx-auto flex w-full max-w-sm gap-1.5"
      role="radiogroup"
      aria-label="選擇 Bestie 人設"
    >
      {PERSONAS.map((item) => {
        if (!isPersonaId(item.id)) return null;
        const locked = !isPersonaUnlocked(item.id, isVip, createdAt);
        const selected = persona === item.id;
        const itemTheme = getDailyCardPersonaTheme(item.id);
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => {
              if (locked) {
                onLockedSelect();
                return;
              }
              onSelect(item.id);
            }}
            className={cn(
              "flex min-w-0 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border px-2 py-1.5",
              dailyCardThemeTransitionClass,
              selected ? itemTheme.pickerSelected : itemTheme.pickerIdle,
              locked && "opacity-75",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <PersonaAvatar personaId={item.id} className="size-6 shrink-0" />
            <span className="truncate text-[11px] font-medium leading-none text-stone-700 dark:text-stone-200">
              {item.shortName.replace(" Bestie", "")}
            </span>
            {locked && <Lock className="size-2.5 shrink-0 text-muted-foreground" aria-label="VIP 解鎖" />}
          </button>
        );
      })}
    </div>
  );
}
