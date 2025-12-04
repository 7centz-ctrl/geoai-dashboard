export function clamp(n, a, b){
  n = Number(n);
  if (Number.isNaN(n)) return a;
  return Math.max(a, Math.min(b, n));
}

export function clockHHMMSS(){
  const d = new Date();
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  return `${hh}:${mm}:${ss}`;
}

export function fmtIsoToHM(iso){
  if (!iso) return "--";
  const s = String(iso);
  const i = s.indexOf("T");
  if (i < 0) return "--";
  return s.slice(i+1, i+6);
}

export function fmtIsoToNice(iso){
  if (!iso) return "--";
  // "2025-12-05T06:00" -> "2025-12-05 06:00"
  return String(iso).replace("T"," ").slice(0,16);
}

export function safeNum(x, fallback=0){
  const n = Number(x);
  return Number.isNaN(n) ? fallback : n;
}
