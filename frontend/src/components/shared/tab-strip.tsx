import {
  useRef,
  type ComponentType,
  type KeyboardEvent,
} from "react";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";

export type TabDef<T extends string> = {
  id: T;
  label: string;
  /** Optional leading icon. Omit for label-only pill tabs (e.g. Identity). */
  icon?: ComponentType<{ size?: number | string; className?: string }>;
};

type Props<T extends string> = {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Accessible name for the tablist. */
  ariaLabel?: string;
};

export function TabStrip<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel = "Sections",
}: Props<T>) {
  // Mobile: 2-col grid with full-width touch targets. Tablet+: a single
  // horizontal-scroll row. Mirrors dd-ui-design's TabStrip — a `role="tablist"`
  // pill/segmented control with roving-tabindex arrow-key navigation.
  const { isMobile } = useResponsiveLayout();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = tabs.length - 1;
    } else {
      return;
    }
    if (next === index) return;
    event.preventDefault();
    onChange(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      data-testid={isMobile ? "tab-strip-grid" : "tab-strip-scroll"}
      style={{
        maxWidth: "100%",
        alignSelf: "stretch",
        overflowX: isMobile ? "visible" : "auto",
      }}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        style={{
          display: isMobile ? "grid" : "inline-flex",
          gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : undefined,
          gap: 4,
          padding: 6,
          background: "var(--surface-sunk)",
          borderRadius: 10,
          minWidth: isMobile ? undefined : "max-content",
          width: isMobile ? "100%" : undefined,
        }}
      >
        {tabs.map((t, index) => {
          const on = active === t.id;
          const Icon = t.icon;
          return (
            <button
              type="button"
              key={t.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: on ? "var(--fg-1)" : "var(--fg-2)",
                cursor: "pointer",
                border: on ? "1px solid var(--border)" : "1px solid transparent",
                background: on ? "var(--card)" : "transparent",
                boxShadow: on ? "0 1px 2px 0 rgba(0,0,0,0.04)" : "none",
                transition: "all 140ms ease-out",
                fontFamily: "inherit",
                whiteSpace: isMobile ? "normal" : "nowrap",
                minHeight: isMobile ? 48 : undefined,
                textAlign: "center",
              }}
            >
              {Icon ? <Icon size={14} /> : null}
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
