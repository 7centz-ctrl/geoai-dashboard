import { fmtIsoToHM, fmtIsoToNice } from "./utils.js";

function q(id){ return document.getElementById(id); }

export function bindUI(){
  return {
    clock: q("clock"),
    regionBtn: q("regionBtn"),
    regionLabel: q("regionLabel"),
    cityLabel: q("cityLabel"),

    liveDot: q("liveDot"),
    statusDot: q("statusDot"),
    statusText: q("statusText"),

    riskBadge: q("riskBadge"),
    chipNow: q("chipNow"),
    chip1h: q("chip1h"),
    chip3h: q("chip3h"),
    chip24h: q("chip24h"),

    riskTitle: q("riskTitle"),
    riskDesc: q("riskDesc"),
    whyBox: q("whyBox"),
    confVal: q("confVal"),
    confBar: q("confBar"),

    tempVal: q("tempVal"),
    tempUpd: q("tempUpd"),
    rainVal: q("rainVal"),
    rainUpd: q("rainUpd"),
    soilVal: q("soilVal"),
    soilUpd: q("soilUpd"),

    dPop: q("dPop"),
    dGust: q("dGust"),
    dSoil: q("dSoil"),
    dTime: q("dTime"),
    subnote: q("subnote"),

    refreshSec: q("refreshSec"),
    modeText: q("modeText"),

    sheetBackdrop: q("sheetBackdrop"),
    sheet: q("sheet"),
    sheetClose: q("sheetClose"),
    regionList: q("regionList"),
  };
}

export function setStatus(ui, ok, text){
  ui.statusDot.className = "status-dot " + (ok ? "ok" : "bad");
  ui.statusText.textContent = text;
}

export function setRegion(ui, label){
  ui.regionLabel.textContent = label;
  ui.cityLabel.textContent = String(label).toUpperCase();
}

function levelToBadge(level){
  const m = {
    AMAN:   { cls:"safe",   t:"AMAN" },
    WASPADA:{ cls:"watch",  t:"WASPADA" },
    SIAGA:  { cls:"warn",   t:"SIAGA" },
    DARURAT:{ cls:"danger", t:"DARURAT" },
  };
  return m[level] || { cls:"safe", t:level || "—" };
}

export function renderRisk(ui, risk){
  const b = levelToBadge(risk.level);
  ui.riskBadge.className = "badge " + b.cls;
  ui.riskBadge.textContent = b.t;

  ui.chipNow.textContent = `${risk.nowMm.toFixed(1)} mm/h`;
  ui.chip1h.textContent = `${risk.rain1h.toFixed(1)} mm`;
  ui.chip3h.textContent = `${risk.rain3h.toFixed(1)} mm`;
  ui.chip24h.textContent = `${risk.rain24h.toFixed(1)} mm`;

  ui.riskTitle.textContent = risk.label;

  const confPct = Math.round((risk.confidence || 0) * 100);
  ui.confVal.textContent = `${confPct}%`;
  ui.confBar.style.width = `${confPct}%`;

  ui.whyBox.textContent = (risk.reasons && risk.reasons.length)
    ? risk.reasons.join(" • ")
    : "Tidak ada sinyal kuat (normal)";

  ui.dPop.textContent  = `${Math.round(risk.popPct)}%`;
  ui.dGust.textContent = `${Math.round(risk.gustKmh)} km/jam`;
  ui.dSoil.textContent = `${Math.round(risk.soilPct)}%`;
  ui.dTime.textContent = fmtIsoToNice(risk.timeIso);

  ui.subnote.textContent =
    `NOW = current precipitation; 1H/3H/24H = akumulasi dari data hourly. Updated(hourly) biasanya per jam, jadi bukan menit-ke-menit.`;
}

export function renderMetrics(ui, risk){
  const updHM = fmtIsoToHM(risk.timeIso);

  ui.tempVal.textContent = risk.tempC.toFixed(1);
  ui.tempUpd.textContent = `Updated · ${updHM}`;

  ui.rainVal.textContent = risk.rain1h.toFixed(1);
  ui.rainUpd.textContent = `Rain (hourly) · ${updHM}`;

  ui.soilVal.textContent = `${Math.round(risk.soilPct)}`;
  ui.soilUpd.textContent = `VWC (0–1 cm) scaled to % · ${updHM}`;
}

export function renderRegionList(ui, regions, activeId, onPick){
  ui.regionList.innerHTML = "";
  regions.forEach(r => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "region-row" + (r.id === activeId ? " active" : "");
    btn.innerHTML = `<span>${r.label}</span><span class="radio" aria-hidden="true"></span>`;
    btn.addEventListener("click", () => onPick(r.id));
    ui.regionList.appendChild(btn);
  });
}

export function openSheet(ui){
  ui.sheetBackdrop.hidden = false;
  ui.sheet.hidden = false;
}

export function closeSheet(ui){
  ui.sheetBackdrop.hidden = true;
  ui.sheet.hidden = true;
}
