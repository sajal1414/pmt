import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Custom vector logo for nFolks ATLAS.
 * Combines an iconic celestial orbital sphere / "A" prism emblem with
 * refined enterprise typography.
 */
export function Logo({
  height = 16,
  style,
  className,
  iconOnly = false,
}: {
  height?: number;
  style?: CSSProperties;
  className?: string;
  iconOnly?: boolean;
}) {
  const iconSize = height * 1.9;

  return (
    <span
      className={cn("inline-flex items-center gap-2.5 select-none", className)}
      style={{ height: iconSize, ...style }}
    >
      {/* Vector Icon Mark: The ATLAS Astrolabe & Prism */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
        aria-label="nFolks ATLAS logo"
      >
        <defs>
          {/* Deep Forest Gradient for Base */}
          <linearGradient id="atlas-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#17594C" />
            <stop offset="50%" stopColor="#134C41" />
            <stop offset="100%" stopColor="#0A2D26" />
          </linearGradient>

          {/* Luminous Gold Gradient */}
          <linearGradient id="atlas-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F6E7B8" />
            <stop offset="50%" stopColor="#D5B064" />
            <stop offset="100%" stopColor="#B38936" />
          </linearGradient>

          {/* Emerald Glow Gradient */}
          <linearGradient id="atlas-emerald-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Subtle Inner Glow */}
          <filter id="atlas-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Squircle Background Shield */}
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="12"
          fill="url(#atlas-bg-grad)"
          stroke="#D5B064"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />

        {/* Outer Celestial Orbital Ring */}
        <ellipse
          cx="24"
          cy="24"
          rx="17"
          ry="7.5"
          transform="rotate(-28 24 24)"
          stroke="url(#atlas-gold-grad)"
          strokeWidth="1.6"
          strokeDasharray="40 4"
          strokeOpacity="0.85"
        />

        {/* Counter Orbital Ring */}
        <ellipse
          cx="24"
          cy="24"
          rx="17"
          ry="7.5"
          transform="rotate(32 24 24)"
          stroke="url(#atlas-emerald-grad)"
          strokeWidth="1.3"
          strokeOpacity="0.45"
        />

        {/* Central Faceted "A" Prism (Atlas Core) */}
        <path
          d="M24 9L34 32H28.5L24 20.5L19.5 32H14L24 9Z"
          fill="url(#atlas-gold-grad)"
          filter="url(#atlas-glow)"
        />

        {/* Center Crossbar / Knowledge Node */}
        <polygon
          points="24,20 28,29 20,29"
          fill="#0A2D26"
          opacity="0.9"
        />

        {/* Apex Core Light Point */}
        <circle cx="24" cy="11.5" r="1.8" fill="#FFFBEB" />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span className="flex flex-col justify-center leading-none">
          <span className="flex items-baseline gap-1.5">
            <span
              className="font-display font-medium tracking-tight text-foreground"
              style={{ fontSize: height * 0.95 }}
            >
              nFolks
            </span>
            <span
              className="font-display font-extrabold tracking-wider bg-linear-to-r from-[#D5B064] via-[#E8C87A] to-[#B38936] bg-clip-text text-transparent"
              style={{ fontSize: height * 1.05 }}
            >
              ATLAS
            </span>
          </span>
          <span
            className="text-[8.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase mt-0.5"
          >
            Learning Services
          </span>
        </span>
      )}
    </span>
  );
}
