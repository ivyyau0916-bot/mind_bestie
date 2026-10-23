import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPersona, type PersonaId } from "@/lib/chat-personas";
import { cn } from "@/lib/utils";

const RING_TONE: Record<PersonaId, string> = {
  gentle: "ring-rose-400/40",
  fierce: "ring-amber-400/40",
  wise: "ring-sky-400/40",
};

type PersonaAvatarProps = {
  personaId: PersonaId;
  className?: string;
  imageClassName?: string;
};

export function PersonaAvatar({ personaId, className, imageClassName }: PersonaAvatarProps) {
  const persona = getPersona(personaId);
  return (
    <Avatar className={cn("ring-2 ring-offset-0 ring-offset-transparent", RING_TONE[personaId], className)}>
      <AvatarImage src={persona.avatarUrl} alt="" className={cn("object-cover bg-muted/30", imageClassName)} />
      <AvatarFallback className="bg-muted text-lg" delayMs={600}>
        {persona.emoji}
      </AvatarFallback>
    </Avatar>
  );
}
