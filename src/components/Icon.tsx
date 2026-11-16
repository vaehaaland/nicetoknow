import { ICONS, type IconName } from "@/lib/icons";

// Material Symbols-ikon som inline SVG; arvar tekstfargen og er dekorativt som standard
export function Icon({ name, size = 24, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 -960 960 960" width={size} height={size} fill="currentColor" className={`shrink-0 ${className}`}>
      <path d={ICONS[name]} />
    </svg>
  );
}
