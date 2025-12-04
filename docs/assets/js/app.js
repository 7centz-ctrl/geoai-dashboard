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

function extractFromOne(raw){
  const cur = raw.current || {};
  const hourly = raw.hourly || {};

  const times = hourly.time || [];
  const precip = hourly.precipitation || [];
  const soil = hourly.soil_moisture_0_to_1cm || [];
  const pop = hourly.precipitation_probability || [];
  const gust = hourly.wind_gusts_10m || [];

  if (!times.length) throw new Error("Missing hourly.time");
  const idx = findNearestIndex(times);

  const tempC = Number(cur.temperature_2m);
  const safeTemp = Number.isNaN(tempC) ? 0 : tempC;

  const rain1h = clamp(Number(precip[idx]) || 0, 0, 500);
  const rain3h = clamp(sumLastN(precip, idx, 3), 0, 1500);
  const rain24h = clamp(sumLastN(precip, idx, 24), 0, 5000);

  const soilVwc = Number(soil[idx]);
  const soilPct = clamp((Number.isNaN(soilVwc) ? 0 : soilVwc) * 100, 0, 100);

  const popPct = clamp(Number(pop[idx]) || 0, 0, 100);

  // open-meteo gust unit km/h (untuk wind_gusts_10m hourly)
  const gustKmh = clamp(Number(gust[idx]) || 0, 0, 200);

  const timeIso = times[idx] || cur.time || new Date().toISOString();

  return { tempC: safeTemp, rain1h, rain3h, rain24h, soilPct, popPct, gustKmh, timeIso };
}

function latestTimeIso(list){
  // Ambil timestamp terbaru yang valid (biar "Updated" nggak ngaco)
  let best = list[0]?.timeIso || new Date().toISOString();
  let bestT = Date.parse(best);
  if (Number.isNaN(bestT)) bestT = 0;

  for (const x of list){
    const t = Date.parse(x.timeIso);
    if (!Number.isNaN(t) && t > bestT){
      bestT = t;
      best = x.timeIso;
    }
  }
  return best;
}

// Skor sederhana buat menentukan titik "paling parah" (untuk konteks user)
function severityScore(x){
  // Bobot lebih berat ke rain 3h/24h + soil (banjir/longsor)
  // pop/gust sebagai penguat
  const r1 = clamp(x.rain1h, 0, 80);
  const r3 = clamp(x.rain3h, 0, 200);
  const r24 = clamp(x.rain24h, 0, 400);
  const soil = clamp(x.soilPct, 0, 100);
  const pop = clamp(x.popPct, 0, 100);
  const gust = clamp(x.gustKmh, 0, 120);

  // Normalisasi kasar (biar stabil)
  const a = (r1 / 20) * 0.8;
  const b = (r3 / 60) * 1.6;
  const c = (r24 / 120) * 1.8;
  const d = (soil / 100) * 1.4;
  const e = (pop / 100) * 0.7;
  const f = (gust / 120) * 0.3;

  return a + b + c + d + e + f;
}

function aggregateWorstCase(list){
  // worst-case = ambil nilai MAX dari semua titik (lebih aman buat warning)
  const pickMax = (k) => list.reduce((m, x) => Math.max(m, Number(x[k]) || 0), 0);

  // temp: rata-rata biar tidak liar (temp beda sedikit antar titik)
  const tempC = list.reduce((s, x) => s + (Number(x.tempC) || 0), 0) / Math.max(1, list.length);

  // time: gunakan timestamp terbaru agar UI "Updated" akurat
  const timeIso = latestTimeIso(list);

  // cari titik paling parah buat konteks (nama diambil dari points index)
  let worstIdx = 0;
  let worstScore = -1;
  for (let i = 0; i < list.length; i++){
    const sc = severityScore(list[i]);
    if (sc > worstScore){
      worstScore = sc;
      worstIdx = i;
    }
  }

  return {
    timeIso,
    tempC,
    rain1h: pickMax("rain1h"),
    rain3h: pickMax("rain3h"),
    rain24h: pickMax("rain24h"),
    soilPct: pickMax("soilPct"),
    popPct: pickMax("popPct"),
    gustKmh: pickMax("gustKmh"),
    worstIdx,
    worstSample: list[worstIdx],
  };
}

function startClock(ui){
  const tick = () => ui.clock.textContent = clockHHMMSS();
  tick();
  setInterval(tick, 1000);
}

function fmt1(n){ return (Math.round((Number(n) || 0) * 10) / 10).toFixed(1); }

async function runOnce(ui, state){
  const region = REGIONS.find(r => r.id === state.activeId) || REGIONS[0];
  setRegion(ui, region.label);

  setStatus(ui, true, "Fetching…");

  // rawList: array response for each point
  const rawList = await fetchWeather(region);

  const extracted = rawList.map(extractFromOne);
  const m = aggregateWorstCase(extracted);

  const risk = computeRisk({
    tempC: m.tempC,
    rain1h: m.rain1h,
    rain3h: m.rain3h,
    rain24h: m.rain24h,
    soilPct: m.soilPct,
    popPct: m.popPct,
    gustKmh: m.gustKmh,
    timeIso: m.timeIso,
  });

  renderRisk(ui, risk);
  renderMetrics(ui, risk);

  // status info: tampilkan jumlah titik + worst point
  const worstName = region.points[m.worstIdx]?.name || `pt#${m.worstIdx + 1}`;
  const ws = m.worstSample || {};
  const hint = `Worst: ${worstName} (3H ${fmt1(ws.rain3h)}mm, 24H ${fmt1(ws.rain24h)}mm, Soil ${fmt1(ws.soilPct)}%)`;

  setStatus(ui, true, `Data OK · ${region.points.length} pts · ${hint}`);
}

function main(){
  const ui = bindUI();
  const state = { activeId: "jakarta" };

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
