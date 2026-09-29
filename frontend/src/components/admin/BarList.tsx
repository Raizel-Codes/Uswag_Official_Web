import type { ReactNode } from 'react';
import type { BarSegment } from './StackedBar';

export interface BarRow {
  key: string;
  label: string;
  /** Shown after the bar; defaults to the row's total. */
  value?: ReactNode;
  segments: BarSegment[];
}

/**
 * A horizontal bar chart: one row per category (e.g. a college), each bar's length relative
 * to the largest row and split into segments. Rows become buttons when `onSelect` is given
 * (jump to that group on the board). Labels sit beside the bar on wide screens and above it
 * on a phone, so long college names never squeeze the bar.
 */
export default function BarList({
  rows,
  label,
  onSelect,
  empty = 'Nothing to chart yet.',
}: {
  rows: BarRow[];
  label: string;
  onSelect?: (key: string) => void;
  empty?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.segments.reduce((s, x) => s + x.value, 0)));
  if (rows.length === 0) return <p className="mp-muted text-center py-6">{empty}</p>;

  return (
    <ul className="ap-barlist" aria-label={label}>
      {rows.map((r) => {
        const total = r.segments.reduce((s, x) => s + x.value, 0);
        const spoken = `${r.label}: ${total}${r.segments.length > 1 ? ` (${r.segments.filter((s) => s.value > 0).map((s) => `${s.label} ${s.value}`).join(', ')})` : ''}`;
        const body = (
          <>
            <span className="ap-barlist__label">{r.label}</span>
            <span className="ap-barlist__track" aria-hidden="true">
              <span className="ap-barlist__fill" style={{ width: `${(total / max) * 100}%` }}>
                {r.segments
                  .filter((s) => s.value > 0)
                  .map((s) => (
                    <span key={s.label} className={`ap-seg ap-seg--${s.tone}`} style={{ flexGrow: s.value }} title={`${s.label}: ${s.value}`} />
                  ))}
              </span>
            </span>
            <span className="ap-barlist__value mp-num">{r.value ?? total}</span>
          </>
        );
        return (
          <li key={r.key}>
            {onSelect ? (
              <button type="button" className="ap-barlist__row ap-barlist__row--button" onClick={() => onSelect(r.key)} aria-label={`${spoken}. Show this group`}>
                {body}
              </button>
            ) : (
              <div className="ap-barlist__row" role="img" aria-label={spoken}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
