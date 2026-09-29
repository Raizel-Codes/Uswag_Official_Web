/**
 * A compact single-value bar for board cells: an attendance rate, or sign-ups against slots.
 * `percent` sets the fill (0–100, clamped); `text` is what's printed beside it. `tone` shifts to
 * warn/danger when a page wants to flag a low (or full) value.
 */
export default function Meter({
  percent,
  text,
  label,
  tone = 'primary',
}: {
  percent: number;
  text: string;
  /** Spoken name of the measure, e.g. "Attendance". */
  label: string;
  tone?: 'primary' | 'warn' | 'danger';
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <span className="ap-meter" role="img" aria-label={`${label}: ${text}`}>
      <span className="ap-meter__track" aria-hidden="true">
        <span className={`ap-meter__fill ${tone === 'primary' ? '' : `ap-meter__fill--${tone}`}`} style={{ width: `${p}%` }} />
      </span>
      <span className="ap-meter__value" aria-hidden="true">{text}</span>
    </span>
  );
}
