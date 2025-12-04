import { PROVIDER } from "./config.js";

function openMeteoUrl({ lat, lon }){
  const qs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",

    // current buat UI
    current: "temperature_2m",

    // hourly buat akurasi
    hourly: [
      "precipitation",
      "rain",
      "showers",
      "precipitation_probability",
      "soil_moisture_0_to_1cm",
      "wind_gusts_10m",
    ].join(","),
  });

  return `https://api.open-meteo.com/v1/forecast?${qs.toString()}`;
}

async function fetchOnePoint(pt){
  const url = openMeteoUrl(pt);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Region sekarang punya multiple points.
 * Kita fetch semuanya paralel (gratis) lalu agregasi.
 */
export async function fetchWeather(region){
  if (PROVIDER !== "open-meteo") {
    throw new Error("Provider not supported in GitHub Pages mode");
  }
  const points = region.points || [];
  if (!points.length) throw new Error("Region points empty");
  return Promise.all(points.map(fetchOnePoint));
}
