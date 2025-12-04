export function pad(n) {
  return n.toString().padStart(2, "0");
}

export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
