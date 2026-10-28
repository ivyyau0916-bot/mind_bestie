import { APP_LOGO_SRC, APP_NAME } from "@/lib/app-brand";
import { cn } from "@/lib/utils";

type BestieAppLogoProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  nameClassName?: string;
};

const sizePx: Record<NonNullable<BestieAppLogoProps["size"]>, string> = {
  xs: "size-4",
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
  xl: "size-14",
};

export function BestieAppLogo({
  className,
  size = "sm",
  showName = false,
  nameClassName,
}: BestieAppLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <img
        src={APP_LOGO_SRC}
        alt=""
        width={512}
        height={512}
        className={cn("shrink-0 rounded-[22%] object-cover shadow-sm", sizePx[size])}
        decoding="async"
      />
      {showName && (
        <span className={cn("font-display tracking-wide", nameClassName)}>{APP_NAME}</span>
      )}
    </span>
  );
}

/** Small brand line used in page sub-headers (logo + app name). */
export function BestieAppBrandLine({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 text-[11px] tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      <BestieAppLogo size="xs" />
      <span>{APP_NAME}</span>
    </p>
  );
}
