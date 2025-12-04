import datetime as dt
import logging
import os
import random
from typing import Literal

import requests
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pydantic import BaseModel

# --- Logging sederhana ---
logger = logging.getLogger("geoai")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = FastAPI(title="GEOAI - West Java Risk API")


class Status(BaseModel):
    timestamp: dt.datetime
    region: str
    temperature_c: float
    precipitation_mm_per_h: float
    soil_saturation_pct: float
    risk_label: str
    risk_level: Literal["AMAN", "WASPADA", "SIAGA", "DARURAT"]
    ai_confidence: float


# === KONFIG API CUACA REAL ===
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
# Koordinat kira-kira Jawa Barat (Bandung-ish)
LAT_WEST_JAVA = -6.9
LON_WEST_JAVA = 107.6


def fetch_weather_west_java() -> tuple[float, float, float]:
    """
    Ambil data cuaca real untuk Jawa Barat dari Open-Meteo.

    - temperature_2m  -> °C
    - precipitation   -> mm/h
    - soil_saturation -> pseudo %, diturunkan dari soil moisture / curah hujan
    """
    params = {
        "latitude": LAT_WEST_JAVA,
        "longitude": LON_WEST_JAVA,
        "hourly": "temperature_2m,precipitation,soil_moisture_0_7cm",
        "forecast_hours": 1,
        "timezone": "auto",
    }

    resp = requests.get(OPEN_METEO_URL, params=params, timeout=5)
    resp.raise_for_status()
    data = resp.json()

    hourly = data["hourly"]
    temp = float(hourly["temperature_2m"][-1])
    precip = float(hourly["precipitation"][-1])

    soil_list = hourly.get("soil_moisture_0_7cm")
    if soil_list is not None:
        # Open-Meteo soil moisture tipenya volumetric (m³/m³).
        # Kita mapping kasar ke 0–100% biar intuitif.
        raw = float(soil_list[-1])
        soil_pct = raw * 200  # 0.25 -> 50%, 0.4 -> 80%, dll
    else:
        # Fallback kalau model nggak punya variabel soil moisture:
        # mulai dari 40%, tambah sesuai curah hujan.
        soil_pct = 40 + precip * 2

    # Clamp 0–100
    soil_pct = max(0.0, min(100.0, soil_pct))

    return temp, precip, soil_pct


def compute_risk(temp: float, precip: float, soil_sat: float):
    """
    Model risiko SEDERHANA (rule-based).
    Nanti bisa diganti model AI/ML beneran pakai data historis banjir/longsor.
    """
    score = 0.0

    # Curah hujan
    if precip > 5:
        score += 1
    if precip > 20:
        score += 1.5
    if precip > 50:
        score += 2
    if precip > 100:
        score += 3

    # Kejenuhan tanah
    if soil_sat > 60:
        score += 1.5
    if soil_sat > 75:
        score += 2
    if soil_sat > 90:
        score += 2

    # Kombinasi suhu tinggi + hujan
    if temp > 30 and precip > 20:
        score += 1

    # Kondisi kering
    if precip < 2 and soil_sat < 55:
        score -= 2

    # Mapping skor -> level
    if score <= 0:
        risk_level = "AMAN"
        label = "AMAN: kondisi relatif normal"
    elif score <= 3:
        risk_level = "WASPADA"
        label = "WASPADA: banjir lokal / longsor kecil"
    elif score <= 6:
        risk_level = "SIAGA"
        label = "SIAGA: risiko banjir & longsor sedang–tinggi"
    else:
        risk_level = "DARURAT"
        label = "DARURAT: risiko banjir besar & longsor"

    # Confidence dummy (nanti diganti output model)
    ai_conf = max(0.5, min(0.99, 0.55 + 0.05 * abs(score)))
    return label, risk_level, ai_conf


@app.get("/api/status", response_model=Status)
def get_status():
    """
    Endpoint utama untuk dashboard.
    1. Coba ambil data cuaca real dari Open-Meteo
    2. Kalau gagal -> fallback random supaya UI tetap jalan
    """
    try:
        temp, precip, soil = fetch_weather_west_java()
        logger.info(
            "Weather (real) T=%.1f°C, P=%.1f mm/h, Soil=%.1f%%",
            temp,
            precip,
            soil,
        )
    except Exception as e:  # noqa: BLE001
        logger.error("Gagal fetch cuaca dari Open-Meteo: %s", e)
        temp = 24 + random.uniform(-5, 5)
        precip = random.uniform(0, 120)
        soil = random.uniform(40, 100)
        logger.info(
            "Weather (fallback random) T=%.1f°C, P=%.1f mm/h, Soil=%.1f%%",
            temp,
            precip,
            soil,
        )

    label, level, conf = compute_risk(temp, precip, soil)

    return Status(
        timestamp=dt.datetime.utcnow(),
        region="West Java",
        temperature_c=round(temp, 1),
        precipitation_mm_per_h=round(precip, 1),
        soil_saturation_pct=round(soil, 1),
        risk_label=label,
        risk_level=level,
        ai_confidence=round(conf, 2),
    )


# === STATIC FRONTEND ===

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")


@app.get("/")
def read_root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    return FileResponse(index_path)
