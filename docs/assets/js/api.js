import { PROVIDER } from "./config.js";

function openMeteoUrl({ lat, lon }){
  const qs = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    current: "temperature_2m",
    hourly: "precipitation,soil_moisture_0_to_1cm",
  });
  return `https://api.open-meteo.com/v1/forecast?${qs.toString()}`;
}

export async function fetchWeather(region){
  if (PROVIDER !== "open-meteo") {
    throw new Error("Provider not supported in GitHub Pages mode");
  }
  const url = openMeteoUrl(region);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
