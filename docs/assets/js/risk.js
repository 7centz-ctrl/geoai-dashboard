import { clamp } from "./utils.js";

export function computeRisk({ tempC, precipMmH, soilPct, timestampIso }) {
  let score = 0;

  // Rain intensity
  if (precipMmH > 5) score += 1;
  if (precipMmH > 20) score += 1.5;
  if (precipMmH > 50) score += 2;
  if (precipMmH > 100) score += 3;

  // Soil saturation
  if (soilPct > 60) score += 1.5;
  if (soilPct > 75) score += 2;
  if (soilPct > 90) score += 2;

  // Hot + heavy rain synergy
  if (tempC > 30 && precipMmH > 20) score += 1;

  // Dry condition reduces risk
  if (precipMmH < 2 && soilPct < 55) score -= 2;

  let risk_level, risk_label;
  if (score <= 0) {
    risk_level = "AMAN";
    risk_label = "AMAN: kondisi relatif normal";
  } else if (score <= 3) {
    risk_level = "WASPADA";
    risk_label = "WASPADA: banjir lokal / longsor kecil";
  } else if (score <= 6) {
    risk_level = "SIAGA";
    risk_label = "SIAGA: risiko banjir & longsor sedang–tinggi";
  } else {
    risk_level = "DARURAT";
    risk_label = "DARURAT: risiko banjir besar & longsor";
  }

  // confidence (heuristic)
  const ai_confidence = clamp(0.55 + 0.05 * Math.abs(score), 0.5, 0.99);

  return {
    timestamp: timestampIso,
    temperature_c: tempC,
    precipitation_mm_per_h: precipMmH,
    soil_saturation_pct: soilPct,
    risk_level,
    risk_label,
    ai_confidence,
  };
}
