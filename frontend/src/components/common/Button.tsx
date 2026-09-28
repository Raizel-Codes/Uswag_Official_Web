import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
}

// Base button primitive. Keep every button in the app going through this
// component so palette/state changes only need to happen in one place.
export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors';
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-light',
    ghost: 'bg-white border border-forest/10 text-forest hover:bg-mist',
    danger: 'bg-white border border-red-200 text-red-700 hover:bg-red-50',
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
