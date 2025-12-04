import { escapeHtml, isoToHHMM } from "./utils.js";

export function bindUI(){
  const el = {
    regionBtn: document.getElementById("regionBtn"),
    regionPill: document.getElementById("regionPill"),
    regionLabel: document.getElementById("regionLabel"),
    clock: document.getElementById("clock"),

    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),

    riskChip: document.getElementById("riskChip"),
    riskLevelLabel: document.getElementById("riskLevelLabel"),
    riskMainText: document.getElementById("riskMainText"),
    confValue: document.getElementById("confValue"),
    confBar: document.getElementById("confBar"),

    r1: document.getElementById("r1"),
    r3: document.getElementById("r3"),
    r24: document.getElementById("r24"),

    tempVal: document.getElementById("tempVal"),
    precipVal: document.getElementById("precipVal"),
    soilVal: document.getElementById("soilVal"),

    timeTemp: document.getElementById("timeTemp"),
    timeRain: document.getElementById("timeRain"),
    timeSoil: document.getElementById("timeSoil"),

    reasonsBox: document.getElementById("reasonsBox"),

    sheet: document.getElementById("regionSheet"),
    sheetBackdrop: document.getElementById("sheetBackdrop"),
    regionList: document.getElementById("regionList"),
    sheetClose: document.getElementById("sheetClose"),
  };

  return el;
}

export function setStatus(ui, ok, text){
  ui.statusDot.dataset.ok = ok ? "1" : "0";
  ui.statusText.textContent = text;
}

export function setRegion(ui, label){
  ui.regionPill.textContent = label;
  ui.regionLabel.textContent = label.toUpperCase();
}

export function renderRisk(ui, r){
  ui.riskChip.dataset.level = r.level;
  ui.riskLevelLabel.textContent = r.level;
  ui.riskMainText.textContent = r.label.toUpperCase();

  ui.r1.textContent = r.rain1h.toFixed(1);
  ui.r3.textContent = r.rain3h.toFixed(1);
  ui.r24.textContent = r.rain24h.toFixed(1);

  const pct = Math.round(r.confidence * 100);
  ui.confValue.textContent = `${pct}%`;
  ui.confBar.style.width = `${pct}%`;

  if (!r.reasons.length) {
    ui.reasonsBox.innerHTML = `<li>Tidak ada sinyal kuat (normal)</li>`;
  } else {
    ui.reasonsBox.innerHTML = r.reasons.map(x => `<li>${escapeHtml(x)}</li>`).join("");
  }
}

export function renderMetrics(ui, r){
  ui.tempVal.textContent = r.tempC.toFixed(1);
  ui.precipVal.textContent = r.rain1h.toFixed(1);
  ui.soilVal.textContent = r.soilPct.toFixed(0);

  const t = isoToHHMM(r.timeIso);
  ui.timeTemp.textContent = t;
  ui.timeRain.textContent = t;
  ui.timeSoil.textContent = t;
}

/* Bottom sheet helpers */
export function openSheet(ui){
  ui.sheetBackdrop.hidden = false;
  ui.sheet.hidden = false;
}
export function closeSheet(ui){
  ui.sheetBackdrop.hidden = true;
  ui.sheet.hidden = true;
}

export function renderRegionList(ui, regions, activeId, onPick){
  ui.regionList.innerHTML = regions.map(r => {
    const active = r.id === activeId ? 'data-active="1"' : 'data-active="0"';
    return `
      <div class="sheet-item" ${active} data-id="${escapeHtml(r.id)}">
        <div>
          <div style="font-weight:800">${escapeHtml(r.label)}</div>
          <div style="font-size:12px;color:rgba(154,164,178,.85)">${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}</div>
        </div>
        <div class="radio" aria-hidden="true"></div>
      </div>
    `;
  }).join("");

  ui.regionList.querySelectorAll(".sheet-item").forEach(node => {
    node.addEventListener("click", () => onPick(node.getAttribute("data-id")));
  });
}
