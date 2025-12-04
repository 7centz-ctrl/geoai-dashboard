import { clamp } from "./utils.js";

export function computeRisk({ tempC, rain1h, rain3h, rain24h, soilPct, popPct, gustKmh, timeIso }){
  let score = 0;
  const reasons = [];

  // Rain
  if (rain1h >= 5)  { score += 1.2; reasons.push(`Hujan 1 jam tinggi (${rain1h.toFixed(1)} mm)`); }
  if (rain3h >= 15) { score += 1.6; reasons.push(`Akumulasi 3 jam tinggi (${rain3h.toFixed(1)} mm)`); }
  if (rain24h >= 50){ score += 1.4; reasons.push(`Akumulasi 24 jam tinggi (${rain24h.toFixed(1)} mm)`); }
  if (rain24h >= 100){score += 2.0; reasons.push(`Akumulasi 24 jam ekstrem (${rain24h.toFixed(1)} mm)`); }

  // Soil moisture
  if (soilPct >= 45){ score += 1.0; reasons.push(`Tanah lembap (${soilPct.toFixed(0)}%)`); }
  if (soilPct >= 55){ score += 1.4; reasons.push(`Tanah jenuh (${soilPct.toFixed(0)}%)`); }
  if (soilPct >= 65){ score += 1.8; reasons.push(`Tanah sangat jenuh (${soilPct.toFixed(0)}%)`); }

  // Probability of precipitation (POP)
  if (popPct >= 60){ score += 0.8; reasons.push(`Peluang hujan tinggi (${popPct.toFixed(0)}%)`); }
  if (popPct >= 80){ score += 1.2; reasons.push(`Peluang hujan sangat tinggi (${popPct.toFixed(0)}%)`); }

  // Wind gusts (indikasi badai lokal)
  if (gustKmh >= 35){ score += 0.6; reasons.push(`Hembusan angin kencang (${gustKmh.toFixed(0)} km/jam)`); }
  if (gustKmh >= 50){ score += 1.0; reasons.push(`Potensi badai lokal (${gustKmh.toFixed(0)} km/jam)`); }

  // Combo
  if (soilPct >= 55 && rain3h >= 10){ score += 0.8; reasons.push(`Kombinasi tanah jenuh + hujan`); }

  // Dry lowers
  if (rain24h < 5 && soilPct < 35 && popPct < 40) {
    score -= 1.5;
    reasons.push(`Kondisi relatif kering`);
  }

  let level, label;
  if (score <= 0) {
    level = "AMAN";
    label = "AMAN: kondisi relatif normal";
  } else if (score <= 3.2) {
    level = "WASPADA";
    label = "WASPADA: potensi genangan / longsor kecil";
  } else if (score <= 6.3) {
    level = "SIAGA";
    label = "SIAGA: risiko banjir & longsor sedang–tinggi";
  } else {
    level = "DARURAT";
    label = "DARURAT: potensi ekstrem, siapkan mitigasi";
  }

  // Confidence: makin banyak sinyal + makin besar score -> makin tinggi
  const signal = clamp(reasons.length, 0, 8);
  const confidence = clamp(0.55 + (signal * 0.05) + (Math.max(0, score) * 0.03), 0.50, 0.98);

  return {
    timeIso,
    tempC,
    rain1h, rain3h, rain24h,
    soilPct,
    popPct,
    gustKmh,
    level,
    label,
    reasons: reasons.slice(0, 5),
    confidence,
  };
}
