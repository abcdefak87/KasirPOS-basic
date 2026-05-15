export const formatRp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;

export const formatRpShort = (n: number) => {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}rb`;
  return `Rp${n}`;
};

export const formatDateID = (d: string | Date) =>
  new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export const formatTimeID = (d: string | Date) =>
  new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
