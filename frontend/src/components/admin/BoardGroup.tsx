import type { ReactNode } from 'react';

/**
 * One collapsible group on a monday.com-style board: an accent strip in the group's colour, the
 * group name and count, and a summary (usually a StackedBar) on the header; rows underneath.
 * Controlled — the page owns which groups are open, so an overview chart can open and jump to
 * one. `accent` cycles through six brand-token shades (.ap-group--a0 … a5 in admin.css).
 */
export default function BoardGroup({
  id,
  title,
  count,
  accent = 0,
  summary,
  columns,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: ReactNode;
  count: ReactNode;
  accent?: number;
  summary?: ReactNode;
  /** Column captions shown above the rows on wide screens (an .ap-board-row of plain text). */
  columns?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`ap-group ap-group--a${accent % 6} scroll-mt-6`} aria-labelledby={`${id}-title`}>
      <header className="ap-group__head">
        <button type="button" className="ap-group__toggle" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-rows`}>
          <svg className="ap-group__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 6 6 6-6 6" />
          </svg>
          <span id={`${id}-title`} className="ap-group__title">{title}</span>
          <span className="ap-group__count">{count}</span>
        </button>
        {summary && <div className="ap-group__summary">{summary}</div>}
      </header>
      {open && (
        <div id={`${id}-rows`} className="ap-group__rows">
          {columns && <div className="ap-board-row ap-board-row--head" aria-hidden="true">{columns}</div>}
          {children}
        </div>
      )}
    </section>
  );
}
