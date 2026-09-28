import logoDefault from '@/assets/images/logo-uswag.svg';
import logoOnDark from '@/assets/images/logo-uswag-on-dark.svg';

interface LogoProps {
  /** 'onDark' for forest/dark surfaces (Sidebar, Footer) — swaps to the light-fill crest variant. */
  variant?: 'default' | 'onDark';
  showWordmark?: boolean;
  /** Icon size in px; wordmark text scales off this. */
  size?: number;
  /** Which type system the wordmark should use — Lora (public site) or Poppins (member/admin portal). */
  wordmarkFont?: 'display' | 'heading';
  className?: string;
}

export default function Logo({
  variant = 'default',
  showWordmark = true,
  size = 36,
  wordmarkFont = 'display',
  className = '',
}: LogoProps) {
  const src = variant === 'onDark' ? logoOnDark : logoDefault;
  const textColorCls = variant === 'onDark' ? 'text-white' : 'text-forest';
  const fontCls = wordmarkFont === 'heading' ? 'font-heading' : 'font-display';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src={src} alt="USWAG" width={size} height={size} className="shrink-0" />
      {showWordmark && (
        <span
          className={`${fontCls} font-bold tracking-tight ${textColorCls}`}
          style={{ fontSize: size * 0.42 }}
        >
          USWAG
        </span>
      )}
    </span>
  );
}
