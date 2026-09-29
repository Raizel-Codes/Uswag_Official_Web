/** Colours a bar segment can take — brand tokens plus the semantic status colours (tokens.css). */
export type BarTone = 'success' | 'warn' | 'grey' | 'danger' | 'primary' | 'sage' | 'deep';

export interface BarSegment {
  label: string;
  value: number;
  tone: BarTone;
}

/**
 * A single horizontal "battery" bar split into proportional segments (monday.com's status
 * summary): e.g. a college's members by standing. Zero-value segments are dropped. The bar is
 * one labelled image for screen readers; `legend` adds a visible key with counts underneath.
 */
export default function StackedBar({
  segments,
  label,
  legend = false,
  size = 'md',
  className = '',
}: {
  segments: BarSegment[];
  /** What the bar shows, e.g. "Members by standing" — prefixed to the spoken breakdown. */
  label: string;
  legend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  const spoken = total === 0 ? `${label}: none yet` : `${label}: ${shown.map((s) => `${s.label} ${s.value}`).join(', ')}`;

  return (
    <div className={className}>
      <div className={`ap-bar ap-bar--${size}`} role="img" aria-label={spoken}>
        {total === 0 ? (
          <span className="ap-bar__empty" />
        ) : (
          shown.map((s) => (
            <span key={s.label} className={`ap-seg ap-seg--${s.tone}`} style={{ flexGrow: s.value }} title={`${s.label}: ${s.value}`} />
          ))
        )}
      </div>
      {legend && (
        <ul className="ap-legend" aria-hidden="true">
          {segments.map((s) => (
            <li key={s.label}>
              <span className={`ap-legend__dot ap-seg--${s.tone}`} />
              {s.label} <span className="mp-num font-semibold">{s.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
