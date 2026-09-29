import type { ReactNode } from 'react';

export type StatTone = 'primary' | 'warn' | 'danger' | 'neutral';

/**
 * A KPI on an engraved plate: seal icon, small-caps label, big Poppins number, optional hint.
 * Replaces KpiCard / the old StatCard in the portal. Tone only colors the number and seal.
 */
export default function StatPlate({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: StatTone;
}) {
  return (
    <div className={`mp-card ap-stat ap-stat--${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <dt className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>{label}</dt>
        {icon && (
          <span className="ap-stat__icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <dd className="mp-stat ap-stat__value mt-2">{value}</dd>
      {hint && <p className="mp-muted text-[0.8125rem] mt-1">{hint}</p>}
    </div>
  );
}
