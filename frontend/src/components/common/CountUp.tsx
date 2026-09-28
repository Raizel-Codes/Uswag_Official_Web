import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ensureGsapRegistered, prefersReducedMotion, EASE } from '@/lib/motion';

ensureGsapRegistered();

interface CountUpProps {
  to: number;
  duration?: number;
  decimals?: number;
  /** Zero-pads the displayed number to this many digits (e.g. padLength=2 → "03"). */
  padLength?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function format(value: number, decimals: number, padLength: number | undefined, prefix: string, suffix: string) {
  const fixed = value.toFixed(decimals);
  const padded = padLength ? fixed.padStart(padLength + (decimals > 0 ? decimals + 1 : 0), '0') : fixed;
  return `${prefix}${padded}${suffix}`;
}

/** Animates a number counting up from 0 when it scrolls into view. Respects prefers-reduced-motion. */
export default function CountUp({
  to,
  duration = 1.6,
  decimals = 0,
  padLength,
  prefix = '',
  suffix = '',
  className = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      if (prefersReducedMotion()) {
        ref.current.textContent = format(to, decimals, padLength, prefix, suffix);
        return;
      }

      const counter = { value: 0 };
      gsap.to(counter, {
        value: to,
        duration,
        ease: EASE.standard,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          if (ref.current) ref.current.textContent = format(counter.value, decimals, padLength, prefix, suffix);
        },
      });
    },
    { scope: ref, dependencies: [to, duration, decimals, padLength, prefix, suffix] }
  );

  return (
    <span ref={ref} className={className}>
      {format(0, decimals, padLength, prefix, suffix)}
    </span>
  );
}
