export const str = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const int = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};
export const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
export const timeOk = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
