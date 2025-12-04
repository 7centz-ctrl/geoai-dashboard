import { REGIONS, REFRESH_MS } from "./config.js";
import { pad, clamp } from "./utils.js";
import { fetchOpenMeteo } from "./api.js";
import { computeRisk } from "./risk.js";
import { getUI, renderRegion, renderMetrics, renderRisk } from "./ui.js";

function startClock(ui) {
  const tick = () => {
    const now = new Date();
    ui.clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };
  tick();
  setInterval(tick, 1000);
}

function extractMetrics(raw) {
  const current = raw.current || {};

  let tempC = Number(current.temperature_2m);
  let precipMmH = Number(current.precipitation ?? 0);

  if (Number.isNaN(tempC)) tempC = 0;
  if (Number.isNaN(precipMmH)) precipMmH = 0;

  // Soil moisture hourly -> soilPct heuristic
  let soilPct = null;
  const arr = raw?.hourly?.soil_moisture_0_to_1cm;
  if (Array.isArray(arr) && arr.length) {
    const last = Number(arr[arr.length - 1]);
    if (!Number.isNaN(last)) soilPct = last * 200; // heuristic scale
  }

  if (soilPct === null || Number.isNaN(soilPct)) {
    soilPct = 35 + precipMmH * 3; // fallback
  }

  soilPct = clamp(soilPct, 0, 100);

  const timestampIso = current.time || new Date().toISOString();
  return { tempC, precipMmH, soilPct, timestampIso };
}

async function update(ui) {
  const key = ui.regionSelect.value;
  const region = REGIONS[key];

  renderRegion(ui, region.label);

  const raw = await fetchOpenMeteo(region);
  const { tempC, precipMmH, soilPct, timestampIso } = extractMetrics(raw);

  const data = computeRisk({ tempC, precipMmH, soilPct, timestampIso });

  renderMetrics(ui, data);
  renderRisk(ui, data);
}

function main() {
  const ui = getUI();
  startClock(ui);

  // initial render
  update(ui).catch(console.error);

  // refresh loop
  setInterval(() => update(ui).catch(console.error), REFRESH_MS);

  // on region change
  ui.regionSelect.addEventListener("change", () => {
    update(ui).catch(console.error);
  });
}

main();
