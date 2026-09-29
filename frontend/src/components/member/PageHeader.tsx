import type { ReactNode } from 'react';

/** Member portal page title: small-caps eyebrow, Poppins h1, optional lead and actions. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="mp-eyebrow">{eyebrow}</p>
        <h1 className="mp-h1 mt-2">{title}</h1>
        {lead && <p className="mp-muted mt-2 text-[0.9375rem] leading-relaxed max-w-[60ch]">{lead}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
