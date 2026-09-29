import type { ReactNode } from 'react';

/**
 * A titled section on an engraved plate card — the portal's replacement for the old white
 * rounded "bg-white rounded-2xl" boxes. `flush` drops the body padding (tables, ledgers).
 */
export default function Panel({
  title,
  aside,
  children,
  flush = false,
  className = '',
  id,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  flush?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={title && id ? `${id}-title` : undefined} className={`mp-card ap-panel ${className}`}>
      {(title || aside) && (
        <header className="ap-panel__head">
          {title && (
            <h2 id={id ? `${id}-title` : undefined} className="mp-h3">
              {title}
            </h2>
          )}
          {aside && <div className="ml-auto flex items-center gap-2 text-[0.8125rem]">{aside}</div>}
        </header>
      )}
      <div className={flush ? '' : 'ap-panel__body'}>{children}</div>
    </section>
  );
}
