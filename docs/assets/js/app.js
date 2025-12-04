import { REGIONS, REFRESH_MS } from "./config.js";
import { clamp, clockHHMMSS, safeNum } from "./utils.js";
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

function extractFromOne(raw){
  const cur = raw.current || {};
  const hourly = raw.hourly || {};

  const times = hourly.time || [];
  if (!times.length) throw new Error("Missing hourly.time");

  const idx = findNearestIndex(times);

  const precip = hourly.precipitation || [];
  const pop = hourly.precipitation_probability || [];
  const soil = hourly.soil_moisture_0_to_1cm || [];
  const gust = hourly.wind_gusts_10m || [];
  const tempH = hourly.temperature_2m || [];

  // NOW (current)
  const nowMm = clamp(safeNum(cur.precipitation, 0), 0, 500);
  const gustNow = clamp(safeNum(cur.wind_gusts_10m, 0), 0, 200);

  // Hourly values at idx
  const tempC = safeNum(cur.temperature_2m, safeNum(tempH[idx], 0));
  const rain1h = clamp(safeNum(precip[idx], 0), 0, 500);
  const rain3h = clamp(sumLastN(precip, idx, 3), 0, 1500);
  const rain24h = clamp(sumLastN(precip, idx, 24), 0, 5000);

  const soilVwc = safeNum(soil[idx], 0);
  const soilPct = clamp(soilVwc * 100, 0, 100);

  const popPct = clamp(safeNum(pop[idx], 0), 0, 100);
  const gustKmh = clamp(safeNum(gust[idx], gustNow), 0, 200);

  const timeIso = times[idx] || cur.time || new Date().toISOString();

  return { nowMm, tempC, rain1h, rain3h, rain24h, soilPct, popPct, gustKmh, timeIso };
}

function pickWorstPoint(extracted){
  // worst = skor terbesar (lebih aman buat warning)
  let best = extracted[0];
  let bestScore = -1;

  for (const e of extracted){
    const score =
      0.22*(e.nowMm/5) +
      0.22*(e.rain1h/20) +
      0.22*(e.rain3h/60) +
      0.18*(e.rain24h/150) +
      0.10*((e.soilPct-30)/50) +
      0.06*(e.popPct/100);

    const s = clamp(score, 0, 2);
    if (s > bestScore){
      bestScore = s;
      best = e;
    }
  }
  return best;
}

function startClock(ui){
  const tick = () => { ui.clock.textContent = clockHHMMSS(); };
  tick();
  setInterval(tick, 1000);
}

async function runOnce(ui, state){
  const region = REGIONS.find(r => r.id === state.activeId) || REGIONS[0];

  setRegion(ui, region.label);
  setStatus(ui, true, "Fetching…");

  const rawList = await fetchWeather(region);

  const extracted = rawList.map(extractFromOne);

  // worst point + context
  const worst = pickWorstPoint(extracted);

  // NOTE: Ini cuma “label”, karena api.js gak nempelkan name.
  // Jadi kita bikin mapping nama by index.
  const worstIdx = extracted.findIndex(x => x === worst);
  const worstName = (region.points[worstIdx] && region.points[worstIdx].name) ? region.points[worstIdx].name : "unknown";

  const risk = computeRisk({
    ...worst,
    timeIso: worst.timeIso,
  });

  renderRisk(ui, risk);
  renderMetrics(ui, risk);

  const hint = `Worst: ${worstName} | NOW ${risk.nowMm.toFixed(1)}mm/h | 3H ${risk.rain3h.toFixed(1)}mm | Soil ${Math.round(risk.soilPct)}%`;
  setStatus(ui, true, `Data OK · ${region.points.length} pts · ${hint}`);
}

function main(){
  const ui = bindUI();
  const state = { activeId: "jakarta" };

  ui.refreshSec.textContent = String(Math.round(REFRESH_MS/1000));
  startClock(ui);

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

  ui.sheetBackdrop.addEventListener("click", () => closeSheet(ui));
  ui.sheetClose.addEventListener("click", () => closeSheet(ui));

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
