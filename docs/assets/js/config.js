export const REFRESH_MS = 30_000;
export const PROVIDER = "open-meteo";

/**
 * Multi-point per region:
 * Kita ambil beberapa titik dalam satu wilayah dan nanti agregasi pakai MAX (worst-case).
 * Ini jauh lebih “kerasa real” dibanding 1 titik.
 */
export const REGIONS = [
  {
    id: "jakarta",
    label: "Jakarta",
    points: [
      { name:"Jakarta Pusat",  lat:-6.1862, lon:106.8340 },
      { name:"Jakarta Utara",  lat:-6.1214, lon:106.7741 },
      { name:"Jakarta Selatan",lat:-6.2615, lon:106.8106 },
      { name:"Jakarta Timur",  lat:-6.2250, lon:106.9000 },
      { name:"Jakarta Barat",  lat:-6.1683, lon:106.7589 },
    ],
  },
  {
    id: "bogor",
    label: "Bogor",
    points: [
      { name:"Bogor Kota",     lat:-6.5971, lon:106.8060 },
      { name:"Cibinong",       lat:-6.4850, lon:106.8410 },
      { name:"Sentul",         lat:-6.5710, lon:106.8570 },
      { name:"Dramaga",        lat:-6.5590, lon:106.7290 },
      { name:"Ciawi",          lat:-6.6680, lon:106.8460 },
    ],
  },
  {
    id: "depok",
    label: "Depok",
    points: [
      { name:"Depok",          lat:-6.4025, lon:106.7942 },
      { name:"Cinere",         lat:-6.3360, lon:106.7860 },
      { name:"Cimanggis",      lat:-6.3700, lon:106.8740 },
      { name:"Beji",           lat:-6.3706, lon:106.8283 },
      { name:"Sawangan",       lat:-6.3890, lon:106.7400 },
    ],
  },
  {
    id: "tangerang",
    label: "Tangerang",
    points: [
      { name:"Tangerang",      lat:-6.1783, lon:106.6319 },
      { name:"Cipondoh",       lat:-6.1760, lon:106.6810 },
      { name:"Ciledug",        lat:-6.2360, lon:106.7070 },
      { name:"Bsd/Serpong",    lat:-6.3000, lon:106.6500 },
      { name:"Balaraja",       lat:-6.1900, lon:106.4600 },
    ],
  },
  {
    id: "bekasi",
    label: "Bekasi",
    points: [
      { name:"Bekasi",         lat:-6.2383, lon:106.9756 },
      { name:"Cikarang",       lat:-6.2610, lon:107.1520 },
      { name:"Tambun",         lat:-6.2600, lon:107.0500 },
      { name:"Babelan",        lat:-6.1200, lon:106.9900 },
      { name:"Setu",           lat:-6.3500, lon:107.0300 },
    ],
  },
];
