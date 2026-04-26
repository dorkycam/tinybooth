import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Brand card surface. Cream background, soft Stone border, generous padding.
 */
export function Card({ children, className = '' }: CardProps): JSX.Element {
  return (
    <div className={`rounded-2xl bg-cream border border-stone p-6 ${className}`}>
      {children}
    </div>
  );
}
