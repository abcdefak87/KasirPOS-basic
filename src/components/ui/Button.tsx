import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_1px_2px_rgb(15_23_42/0.12)]",
  secondary:
    "bg-white text-text border border-border hover:bg-surface-muted active:bg-surface-muted",
  ghost: "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text",
  danger:
    "bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-600",
  success:
    "bg-success-600 text-white hover:bg-success-700 active:bg-success-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, fullWidth, className = "", children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin"
          aria-hidden
        />
      )}
      {children}
    </button>
  );
});
