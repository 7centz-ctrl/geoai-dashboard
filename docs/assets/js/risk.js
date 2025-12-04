import { clamp } from "./utils.js";

/**
 * Input (semua angka):
 * - nowMm: current precipitation (indikasi NOW)
 * - rain1h, rain3h, rain24h (hourly bucket)
 * - soilPct (0..100)
 * - popPct (0..100)
 * - gustKmh
 * - timeIso (hourly timestamp)
 */
export function computeRisk(m){
  const reasons = [];

  // Signals (normalized 0..1)
  const sNow = clamp(m.nowMm / 5, 0, 1);          // 0..5mm/h dianggap range penting
  const s1h  = clamp(m.rain1h / 20, 0, 1);        // 0..20mm/h
  const s3h  = clamp(m.rain3h / 60, 0, 1);        // 0..60mm/3h
  const s24h = clamp(m.rain24h / 150, 0, 1);      // 0..150mm/24h
  const sSoil= clamp((m.soilPct - 30) / 50, 0, 1);// soil >30% mulai relevan
  const sPop = clamp(m.popPct / 100, 0, 1);
  const sGust= clamp(m.gustKmh / 80, 0, 1);

  // Weighted score
  const score =
    0.20*sNow +
    0.22*s1h +
    0.22*s3h +
    0.16*s24h +
    0.12*sSoil +
    0.06*sPop +
    0.02*sGust;

  // Level thresholds (tweakable)
  let level = "AMAN";
  if (score >= 0.75) level = "DARURAT";
  else if (score >= 0.52) level = "SIAGA";
  else if (score >= 0.30) level = "WASPADA";

  // Human label
  const labelMap = {
    AMAN: "AMAN: kondisi relatif normal",
    WASPADA: "WASPADA: potensi banjir lokal / longsor kecil",
    SIAGA: "SIAGA: risiko banjir & longsor sedang–tinggi",
    DARURAT: "DARURAT: risiko tinggi (perlu perhatian serius)",
  };

  // Reasons (make it feel explainable)
  if (m.nowMm >= 1) reasons.push(`Hujan saat ini terdeteksi (${m.nowMm.toFixed(1)} mm/h)`);
  if (m.rain1h >= 5) reasons.push(`1 jam: ${m.rain1h.toFixed(1)} mm`);
  if (m.rain3h >= 15) reasons.push(`3 jam: ${m.rain3h.toFixed(1)} mm`);
  if (m.rain24h >= 50) reasons.push(`24 jam: ${m.rain24h.toFixed(1)} mm`);
  if (m.soilPct >= 60) reasons.push(`Tanah lembap tinggi (${Math.round(m.soilPct)}%)`);
  if (m.popPct >= 60) reasons.push(`Probabilitas hujan tinggi (${Math.round(m.popPct)}%)`);
  if (m.gustKmh >= 40) reasons.push(`Gust cukup kuat (${Math.round(m.gustKmh)} km/jam)`);

  // Confidence = seberapa banyak sinyal yang "aktif"
  const active =
    (m.nowMm >= 1) +
    (m.rain1h >= 2) +
    (m.rain3h >= 8) +
    (m.rain24h >= 30) +
    (m.soilPct >= 50) +
    (m.popPct >= 50);

  const confidence = clamp(0.25 + 0.12*active + 0.55*score, 0.05, 0.98);

  return {
    level,
    label: labelMap[level] || level,
    confidence,
    reasons,
    ...m,
  };
}
