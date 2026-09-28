import type { CSSProperties, ReactNode } from "react";

// Exactly one of these two must be given: a visible title, or an explicit
// srOnlyTitle for a page whose identity lives entirely in the meta row.
// This keeps "every SurfaceHeader has a heading landmark" a compile-time
// fact instead of something a future call site can silently drop.
type SurfaceHeaderHeadingProps =
  | { title: ReactNode; titleTitle?: string; srOnlyTitle?: never }
  | { title?: never; titleTitle?: never; srOnlyTitle: string };

export function SurfaceHeader({
  eyebrow,
  title,
  titleTitle,
  srOnlyTitle,
  meta,
  actions,
  framed = false,
  style,
  titleStyle,
}: {
  eyebrow?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  framed?: boolean;
  style?: CSSProperties;
  titleStyle?: CSSProperties;
} & SurfaceHeaderHeadingProps) {
  return (
    <div
      style={{
        ...(framed
          ? {
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 18,
            }
          : {}),
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 10,
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: "1 1 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {eyebrow ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--primary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {eyebrow}
            </span>
          ) : null}

          {title ? (
            <h1
              style={{
                fontFamily: "inherit",
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                color: "var(--fg-1)",
                ...titleStyle,
              }}
              title={titleTitle}
            >
              {title}
            </h1>
          ) : srOnlyTitle ? (
            <h1 className="sr-only">{srOnlyTitle}</h1>
          ) : null}

          {meta ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              flexShrink: 0,
              alignItems: "center",
            }}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
