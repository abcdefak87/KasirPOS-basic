import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef, ReactNode } from "react";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const baseInput =
  "w-full h-10 px-3 rounded-lg border bg-white text-text placeholder:text-text-subtle transition-colors outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailingIcon, className = "", id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInput} ${leadingIcon ? "pl-9" : ""} ${
            trailingIcon ? "pr-9" : ""
          } ${error ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20" : "border-border"} ${className}`}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle">
            {trailingIcon}
          </span>
        )}
      </div>
      {(hint || error) && (
        <p className={`mt-1 text-xs ${error ? "text-danger-600" : "text-text-subtle"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className = "", id, children, ...rest },
  ref
) {
  const selId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selId} className="block text-xs font-medium text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selId}
          className={`${baseInput} appearance-none pr-9 ${
            error ? "border-danger-500" : "border-border"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {(hint || error) && (
        <p className={`mt-1 text-xs ${error ? "text-danger-600" : "text-text-subtle"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
