export const PROVIDER = "open-meteo";

// Refresh interval (frontend only; jangan terlalu cepat biar ga spam request)
export const REFRESH_MS = 30_000;

export const REGIONS = [
  {
    id: "jakarta",
    label: "Jakarta",
    points: [
      { name: "Jakarta Pusat", lat: -6.1751, lon: 106.8650 },
      { name: "Jakarta Utara", lat: -6.1214, lon: 106.7741 },
      { name: "Jakarta Barat", lat: -6.1683, lon: 106.7588 },
      { name: "Jakarta Timur", lat: -6.2250, lon: 106.9000 },
      { name: "Jakarta Selatan", lat: -6.2615, lon: 106.8106 },
    ],
  },
  {
    id: "bogor",
    label: "Bogor",
    points: [
      { name: "Bogor Kota", lat: -6.5950, lon: 106.8166 },
      { name: "Bogor Utara", lat: -6.5600, lon: 106.8000 },
      { name: "Bogor Selatan", lat: -6.6350, lon: 106.8300 },
      { name: "Ciawi", lat: -6.6750, lon: 106.8600 },
      { name: "Sentul", lat: -6.5700, lon: 106.8800 },
    ],
  },
  {
    id: "depok",
    label: "Depok",
    points: [
      { name: "Depok Tengah", lat: -6.4025, lon: 106.7942 },
      { name: "Beji", lat: -6.3740, lon: 106.8280 },
      { name: "Sawangan", lat: -6.4070, lon: 106.7380 },
      { name: "Cinere", lat: -6.3300, lon: 106.7830 },
      { name: "Tapos", lat: -6.4300, lon: 106.8600 },
    ],
  },
  {
    id: "tangerang",
    label: "Tangerang",
    points: [
      { name: "Tangerang Kota", lat: -6.1783, lon: 106.6319 },
      { name: "Cipondoh", lat: -6.1760, lon: 106.6790 },
      { name: "Karawaci", lat: -6.1900, lon: 106.6100 },
      { name: "BSD", lat: -6.3000, lon: 106.6500 },
      { name: "Bandara (Soetta)", lat: -6.1256, lon: 106.6559 },
    ],
  },
  {
    id: "bekasi",
    label: "Bekasi",
    points: [
      { name: "Bekasi Kota", lat: -6.2383, lon: 106.9756 },
      { name: "Bekasi Barat", lat: -6.2400, lon: 106.9400 },
      { name: "Bekasi Timur", lat: -6.2400, lon: 107.0100 },
      { name: "Tambun", lat: -6.2650, lon: 107.0700 },
      { name: "Cibitung", lat: -6.2550, lon: 107.0900 },
    ],
  },
];
