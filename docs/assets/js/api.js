import { PROVIDER } from "./config.js";

function openMeteoUrl({ lat, lon }){
  const qs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",

    // current: biar ada "NOW" (lebih terasa realtime)
    current: [
      "temperature_2m",
      "precipitation",
      "rain",
      "showers",
      "wind_gusts_10m",
    ].join(","),

    // hourly: buat agregasi per jam (jujur & stabil)
    hourly: [
      "precipitation",
      "precipitation_probability",
      "soil_moisture_0_to_1cm",
      "wind_gusts_10m",
      "temperature_2m",
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
 * Region multi-point:
 * - fetch paralel (gratis)
 * - nanti di app.js kita ambil worst-point (lebih aman untuk warning)
 */
export async function fetchWeather(region){
  if (PROVIDER !== "open-meteo") throw new Error("Provider not supported");
  const points = region.points || [];
  if (!points.length) throw new Error("Region points empty");
  return Promise.all(points.map(fetchOnePoint));
}
