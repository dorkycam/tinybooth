import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

/** Brand button. Two variants: primary (Ink) and secondary (Cream). */
export function Button({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: ButtonProps): JSX.Element {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-ink text-paper hover:bg-coral'
      : 'bg-cream text-ink hover:bg-stone';
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
