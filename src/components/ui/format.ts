// Cached formatters — toLocaleString creates a new Intl.NumberFormat per call
const nfID = new Intl.NumberFormat("id-ID");
const dfID = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const tfID = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatRp = (n: number) => `Rp${nfID.format(n)}`;

export const formatRpShort = (n: number) => {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (n >= 1_000) return `Rp${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}rb`;
  return `Rp${n}`;
};

export const formatDateID = (d: string | Date) =>
  dfID.format(typeof d === "string" ? new Date(d) : d);

export const formatTimeID = (d: string | Date) =>
  tfID.format(typeof d === "string" ? new Date(d) : d);
