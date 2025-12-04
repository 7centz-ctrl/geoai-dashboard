import { REGIONS, REFRESH_MS } from "./config.js";
import { clamp, clockHHMMSS } from "./utils.js";
import { fetchWeather } from "./api.js";
import { computeRisk } from "./risk.js";
import {
  bindUI, setStatus, setRegion,
  renderRisk, renderMetrics,
  openSheet, closeSheet, renderRegionList
} from "./ui.js";

function findNearestIndex(timesIso){
  const now = Date.now();
  let best = 0;
  for (let i = 0; i < timesIso.length; i++){
    const t = Date.parse(timesIso[i]);
    if (!Number.isNaN(t) && t <= now) best = i;
  }
  return best;
}

function sumLastN(arr, endIdx, n){
  let s = 0;
  const start = Math.max(0, endIdx - n + 1);
  for (let i = start; i <= endIdx; i++){
    const v = Number(arr[i]);
    if (!Number.isNaN(v)) s += v;
  }
  return s;
}

function extractOpenMeteo(raw){
  const cur = raw.current || {};
  const hourly = raw.hourly || {};

  const times = hourly.time || [];
  const precip = hourly.precipitation || [];
  const soil = hourly.soil_moisture_0_to_1cm || [];

  if (!times.length || precip.length !== times.length || soil.length !== times.length){
    throw new Error("Hourly arrays missing/mismatch (time/precip/soil)");
  }

  const idx = findNearestIndex(times);

  const tempC = Number(cur.temperature_2m);
  const safeTemp = Number.isNaN(tempC) ? 0 : tempC;

  const rain1h = clamp(Number(precip[idx]) || 0, 0, 500);
  const rain3h = clamp(sumLastN(precip, idx, 3), 0, 1500);
  const rain24h = clamp(sumLastN(precip, idx, 24), 0, 5000);

  const soilVwc = Number(soil[idx]);
  const soilPct = clamp((Number.isNaN(soilVwc) ? 0 : soilVwc) * 100, 0, 100);

  const timeIso = times[idx] || cur.time || new Date().toISOString();
  return { tempC: safeTemp, rain1h, rain3h, rain24h, soilPct, timeIso };
}

function startClock(ui){
  const tick = () => ui.clock.textContent = clockHHMMSS();
  tick();
  setInterval(tick, 1000);
}

async function runOnce(ui, state){
  const region = REGIONS.find(r => r.id === state.activeId) || REGIONS[0];
  setRegion(ui, region.label);

  setStatus(ui, true, "Fetching…");
  const raw = await fetchWeather(region);
  const m = extractOpenMeteo(raw);

  const risk = computeRisk({
    tempC: m.tempC,
    rain1h: m.rain1h,
    rain3h: m.rain3h,
    rain24h: m.rain24h,
    soilPct: m.soilPct,
    timeIso: m.timeIso,
  });

  renderRisk(ui, risk);
  renderMetrics(ui, risk);
  setStatus(ui, true, "Data OK");
}

function main(){
  const ui = bindUI();
  const state = { activeId: "jakarta" };

  startClock(ui);

  // Sheet events
  ui.regionBtn.addEventListener("click", () => {
    renderRegionList(ui, REGIONS, state.activeId, (pickedId) => {
      state.activeId = pickedId;
      closeSheet(ui);
      runOnce(ui, state).catch(err => {
        console.error(err);
        setStatus(ui, false, "API / Data error");
      });
    });
    openSheet(ui);
  });
  ui.sheetClose.addEventListener("click", () => closeSheet(ui));
  ui.sheetBackdrop.addEventListener("click", () => closeSheet(ui));

  // first load + interval
  runOnce(ui, state).catch(err => {
    console.error(err);
    setStatus(ui, false, "API / Data error");
  });
  setInterval(() => {
    runOnce(ui, state).catch(err => {
      console.error(err);
      setStatus(ui, false, "API / Data error");
    });
  }, REFRESH_MS);
}

main();
