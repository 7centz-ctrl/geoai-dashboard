import { clamp } from "./utils.js";

/**
 * Inputs:
 * - tempC: current temperature
 * - rain1h: mm in last 1 hour (hourly precipitation at current hour)
 * - rain3h: sum last 3 hours
 * - rain24h: sum last 24 hours
 * - soilPct: soil moisture VWC * 100
 */
export function computeRisk({ tempC, rain1h, rain3h, rain24h, soilPct, timeIso }){
  let score = 0;
  const reasons = [];

  // Rain intensity / accumulation
  if (rain1h >= 5)  { score += 1.0; reasons.push(`Hujan 1 jam tinggi (${rain1h.toFixed(1)} mm)`); }
  if (rain3h >= 15) { score += 1.5; reasons.push(`Akumulasi 3 jam tinggi (${rain3h.toFixed(1)} mm)`); }
  if (rain24h >= 50){ score += 1.5; reasons.push(`Akumulasi 24 jam tinggi (${rain24h.toFixed(1)} mm)`); }
  if (rain24h >= 100){score += 2.0; reasons.push(`Akumulasi 24 jam ekstrem (${rain24h.toFixed(1)} mm)`); }

  // Soil
  if (soilPct >= 45){ score += 1.0; reasons.push(`Tanah lembap (${soilPct.toFixed(0)}%)`); }
  if (soilPct >= 55){ score += 1.5; reasons.push(`Tanah jenuh (${soilPct.toFixed(0)}%)`); }
  if (soilPct >= 65){ score += 2.0; reasons.push(`Tanah sangat jenuh (${soilPct.toFixed(0)}%)`); }

  // Combo
  if (tempC >= 30 && rain1h >= 5){ score += 0.5; reasons.push(`Panas + hujan (konveksi)`); }

  // Dry lowers
  if (rain24h < 5 && soilPct < 35) {
    score -= 1.5;
    reasons.push(`Kondisi relatif kering`);
  }

  let level, label;
  if (score <= 0) {
    level = "AMAN";
    label = "AMAN: kondisi relatif normal";
  } else if (score <= 3) {
    level = "WASPADA";
    label = "WASPADA: potensi genangan / longsor kecil";
  } else if (score <= 6) {
    level = "SIAGA";
    label = "SIAGA: risiko banjir & longsor sedang–tinggi";
  } else {
    level = "DARURAT";
    label = "DARURAT: risiko tinggi, waspada ekstrem";
  }

  const signal = clamp(reasons.length, 0, 6);
  const confidence = clamp(0.55 + (signal * 0.06) + (Math.max(0, score) * 0.03), 0.50, 0.98);

  return {
    timeIso,
    tempC,
    rain1h,
    rain3h,
    rain24h,
    soilPct,
    level,
    label,
    reasons: reasons.slice(0, 4),
    confidence,
  };
}
