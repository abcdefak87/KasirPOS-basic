export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-surface-muted rounded-md animate-pulse ${className}`}
      aria-hidden
    />
  );
}
