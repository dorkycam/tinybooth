import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

/** Brand text input with optional label and hint. */
export function TextField({
  label,
  hint,
  id,
  className = '',
  ...rest
}: TextFieldProps): JSX.Element {
  const inputId = id ?? `tf-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <label htmlFor={inputId} className="block">
      {label ? <span className="block text-sm font-semibold text-ink mb-1">{label}</span> : null}
      <input
        id={inputId}
        className={`w-full rounded-lg border border-stone bg-cream px-4 py-3 text-ink focus:border-coral focus:outline-none ${className}`}
        {...rest}
      />
      {hint ? <span className="mt-1 block text-xs text-graphite">{hint}</span> : null}
    </label>
  );
}
