import type { ReactNode } from "react";

type KpiTone = "primary" | "warn" | "danger" | "neutral";

const TONE_STYLES: Record<KpiTone, { chip: string; icon: string; value: string }> = {
  primary: { chip: "bg-primary/10", icon: "stroke-primary", value: "text-primary" },
  warn: { chip: "bg-amber-50", icon: "stroke-amber-500", value: "text-amber-600" },
  danger: { chip: "bg-red-50", icon: "stroke-red-500", value: "text-red-600" },
  neutral: { chip: "bg-mist", icon: "stroke-forest", value: "text-forest" },
};

interface KpiCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone?: KpiTone;
  hint?: string;
}

/**
 * Modernized KPI stat card — icon chip + headline number + label, with an
 * optional hint line (e.g. "+3 this week"). Replaces the plain
 * number-over-label `.stat-card` from the prototype with a richer,
 * dashboard-style tile while keeping the same design tokens.
 */
export default function KpiCard({ icon, value, label, tone = "neutral", hint }: KpiCardProps) {
  const t = TONE_STYLES[tone];
  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-forest/5 flex flex-col gap-2.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.chip}`}>
        <span className={`w-4 h-4 ${t.icon} [&>svg]:w-full [&>svg]:h-full`}>{icon}</span>
      </div>
      <div>
        <div className={`font-heading font-extrabold text-[19px] leading-none ${t.value}`}>{value}</div>
        <div className="text-[10.5px] text-gray-500 font-semibold mt-1.5">{label}</div>
        {hint && <div className="text-[10px] text-gray-400 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}
