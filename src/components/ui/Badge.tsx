import { HTMLAttributes } from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "konter" | "printing";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-text-muted",
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
  konter: "bg-konter-50 text-konter-700",
  printing: "bg-printing-50 text-printing-700",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...rest }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tones[tone]} ${className}`}
      {...rest}
    />
  );
}
