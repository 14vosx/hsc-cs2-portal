export function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function fmt(v, digits) {
  if (v === null || v === undefined) return "-";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : "-";
}
