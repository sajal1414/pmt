type Tone = "neutral" | "success" | "warning" | "info" | "danger" | "gold";

const TONE_STYLES: Record<Tone, [string, string]> = {
  neutral: ["var(--surface-2)", "var(--fg-2)"],
  success: ["var(--success-100)", "var(--success-fg)"],
  warning: ["var(--warning-100)", "var(--warning-fg)"],
  info: ["var(--info-100)", "var(--info-fg)"],
  danger: ["var(--danger-100)", "var(--danger-fg)"],
  gold: ["var(--gold-soft)", "var(--gold-strong)"],
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const [bg, fg] = TONE_STYLES[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

const COURSE_STATUS_TONE: Record<string, Tone> = {
  available: "success",
  in_development: "info",
  published: "success",
  in_progress: "info",
  for_review: "warning",
  updated_version: "warning",
  draft: "neutral",
  pipeline: "gold",
  backlog: "neutral",
  custom: "gold",
  lockheed: "info",
  retired: "neutral",
};

export function courseStatusTone(status: string): Tone {
  return COURSE_STATUS_TONE[status] ?? "neutral";
}

export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
