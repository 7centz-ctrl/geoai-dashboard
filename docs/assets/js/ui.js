import { formatTime } from "./utils.js";

export function getUI() {
  return {
    regionSelect: document.getElementById("regionSelect"),
    regionLabel: document.getElementById("regionLabel"),
    clock: document.getElementById("clock"),

    tempVal: document.getElementById("tempVal"),
    precipVal: document.getElementById("precipVal"),
    soilVal: document.getElementById("soilVal"),

    tempTime: document.getElementById("tempTime"),
    precipTime: document.getElementById("precipTime"),
    soilTime: document.getElementById("soilTime"),

    riskChip: document.getElementById("riskChip"),
    riskLevelLabel: document.getElementById("riskLevelLabel"),
    riskMainText: document.getElementById("riskMainText"),
    confValue: document.getElementById("confValue"),
    confBar: document.getElementById("confBar"),
  };
}

export function renderRegion(ui, label) {
  ui.regionLabel.textContent = label;
}

export function renderMetrics(ui, data) {
  ui.tempVal.textContent = data.temperature_c.toFixed(1);
  ui.precipVal.textContent = data.precipitation_mm_per_h.toFixed(1);
  ui.soilVal.textContent = data.soil_saturation_pct.toFixed(1);

  const t = formatTime(data.timestamp);
  ui.tempTime.textContent = t;
  ui.precipTime.textContent = t;
  ui.soilTime.textContent = t;
}

export function renderRisk(ui, data) {
  ui.riskChip.dataset.level = data.risk_level;
  ui.riskLevelLabel.textContent = data.risk_level;
  ui.riskMainText.textContent = data.risk_label.toUpperCase();

  const confPercent = Math.round(data.ai_confidence * 100);
  ui.confValue.textContent = confPercent + "%";
  ui.confBar.style.width = confPercent + "%";
}
