function q(id){ return document.getElementById(id); }

export function bindUI(){
  return {
    clock: q("clock"),
    regionBtn: q("regionBtn"),
    regionLabel: q("regionLabel"),
    cityLabel: q("cityLabel"),

    statusDot: q("statusDot"),
    statusText: q("statusText"),

    riskBadge: q("riskBadge"),
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
    popVal: q("popVal"),
    popUpd: q("popUpd"),
    gustVal: q("gustVal"),
    gustUpd: q("gustUpd"),

    dPop: q("dPop"),
    dGust: q("dGust"),
    dSoil: q("dSoil"),
    dTime: q("dTime"),

    refreshSec: q("refreshSec"),

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
  return m[level] || { cls:"neutral", t:level || "—" };
}

export function renderRisk(ui, risk){
  const b = levelToBadge(risk.level);
  ui.riskBadge.className = "badge " + b.cls;
  ui.riskBadge.textContent = b.t;

  ui.chip1h.textContent = `${risk.rain1h.toFixed(1)} mm`;
  ui.chip3h.textContent = `${risk.rain3h.toFixed(1)} mm`;
  ui.chip24h.textContent = `${risk.rain24h.toFixed(1)} mm`;

  ui.riskTitle.textContent = risk.label;
  ui.riskDesc.textContent = "Model rule-based eksperimen · bisa diganti AI/ML kalau dataset historis & validasi sudah siap.";

  const confPct = Math.round((risk.confidence || 0) * 100);
  ui.confVal.textContent = `${confPct}%`;
  ui.confBar.style.width = `${confPct}%`;

  ui.whyBox.textContent = (risk.reasons && risk.reasons.length)
    ? risk.reasons.join(" • ")
    : "Tidak ada sinyal kuat (normal)";

  ui.dPop.textContent = `${Math.round(risk.popPct)}%`;
  ui.dGust.textContent = `${Math.round(risk.gustKmh)} km/jam`;
  ui.dSoil.textContent = `${Math.round(risk.soilPct)}%`;
  ui.dTime.textContent = (risk.timeIso || "--").replace("T"," ").slice(0,16);
}

export function renderMetrics(ui, risk){
  ui.tempVal.textContent = risk.tempC.toFixed(1);
  ui.rainVal.textContent = risk.rain1h.toFixed(1);
  ui.soilVal.textContent = `${Math.round(risk.soilPct)}`;
  ui.popVal.textContent  = `${Math.round(risk.popPct)}`;
  ui.gustVal.textContent = `${Math.round(risk.gustKmh)}`;

  const upd = (risk.timeIso || "--").replace("T"," ").slice(11,16);
  ui.tempUpd.textContent = `Updated · ${upd}`;
  ui.rainUpd.textContent = `Rain (last 1 hour) · ${upd}`;
  ui.soilUpd.textContent = `VWC (0–1 cm) scaled to % · ${upd}`;
  ui.popUpd.textContent  = `Probability (hourly) · ${upd}`;
  ui.gustUpd.textContent = `Gusts (hourly) · ${upd}`;
}

export function renderRegionList(ui, regions, activeId, onPick){
  ui.regionList.innerHTML = "";
  regions.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "region-row" + (r.id === activeId ? " active" : "");
    btn.innerHTML = `<span>${r.label}</span><span class="radio"></span>`;
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
