import { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "brand" | "success" | "warning";
}

const toneStyles = {
  default: "text-text",
  brand: "text-brand-700",
  success: "text-success-700",
  warning: "text-warning-600",
};

const iconBg = {
  default: "bg-surface-muted text-text-muted",
  brand: "bg-brand-50 text-brand-600",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-600",
};

export function StatCard({ label, value, hint, icon, tone = "default" }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-card flex flex-col gap-3 min-h-[112px]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
        {icon && (
          <span className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl ${iconBg[tone]}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className={`text-2xl font-semibold tracking-tight num ${toneStyles[tone]}`}>{value}</p>
        {hint && <p className="text-xs text-text-subtle mt-1">{hint}</p>}
      </div>
    </div>
  );
}
