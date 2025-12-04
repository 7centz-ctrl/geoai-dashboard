export function buildOpenMeteoUrl({ lat, lon }) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,precipitation",
    hourly: "soil_moisture_0_to_1cm",
    timezone: "auto",
  });
  return "https://api.open-meteo.com/v1/forecast?" + params.toString();
}

export async function fetchOpenMeteo(region) {
  const url = buildOpenMeteoUrl(region);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  return res.json();
}
