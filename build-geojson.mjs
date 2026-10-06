import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import FitParser from "fit-file-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fitDir = path.join(__dirname, "data", "fit");
const outFile = path.join(__dirname, "data", "tracks.geojson");

const META = {
  "480496051818627774": {
    date: "2026-09-21",
    name: "Vielha (morning)",
    distanceKm: 40.42,
    elevGainM: 1590,
    avgHr: 124,
    duration: "3:34:36",
  },
  "480498558200479745": {
    date: "2026-09-21",
    name: "Vielha (afternoon)",
    distanceKm: 27.65,
    elevGainM: 1310,
    avgHr: 123,
    duration: "2:15:14",
  },
  "480518500272603141": {
    date: "2026-09-22",
    name: "Tírvia",
    distanceKm: 25.44,
    elevGainM: 1089,
    avgHr: 113,
    duration: "2:05:34",
  },
  "480522330846560658": {
    date: "2026-09-22",
    name: "Esterri d'Àneu",
    distanceKm: 34.72,
    elevGainM: 1391,
    avgHr: 110,
    duration: "2:46:34",
  },
  "480542550478848100": {
    date: "2026-09-23",
    name: "Vielha",
    distanceKm: 36.62,
    elevGainM: 1952,
    avgHr: 117,
    duration: "3:25:03",
  },
  "480565018792854010": {
    date: "2026-09-24",
    name: "Lérida / Val d'Aran",
    distanceKm: 20.15,
    elevGainM: 854,
    avgHr: 110,
    duration: "3:03:41",
  },
  "480567616442761321": {
    date: "2026-09-24",
    name: "Es Bòrdes",
    distanceKm: 22.81,
    elevGainM: 1155,
    avgHr: 126,
    duration: "2:15:00",
  },
  "480591244133695591": {
    date: "2026-09-25",
    name: "El Pont de Suert",
    distanceKm: 43.21,
    elevGainM: 1714,
    avgHr: 111,
    duration: "3:55:58",
  },
  "480639516076441601": {
    date: "2026-09-26",
    name: "Lérida",
    distanceKm: 20.4,
    elevGainM: 1096,
    avgHr: 112,
    duration: "1:58:38",
  },
};

function parseFit(buffer) {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: "km/h",
      lengthUnit: "km",
      temperatureUnit: "celsius",
      elapsedRecordField: true,
      mode: "list",
    });
    parser.parse(buffer, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

function downsample(coords, maxPoints = 2500) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  const last = coords[coords.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

const features = [];
const files = fs.readdirSync(fitDir).filter((f) => f.endsWith(".fit")).sort();

for (const file of files) {
  const id = path.basename(file, ".fit");
  const meta = META[id] || { name: id, date: "unknown" };
  const buf = fs.readFileSync(path.join(fitDir, file));
  const data = await parseFit(buf);
  const records = data.records || [];
  const coords = [];
  for (const r of records) {
    if (typeof r.position_lat === "number" && typeof r.position_long === "number") {
      coords.push([r.position_long, r.position_lat]);
    }
  }
  const line = downsample(coords);
  if (line.length < 2) {
    console.warn(`Skipping ${file}: too few GPS points (${coords.length})`);
    continue;
  }
  features.push({
    type: "Feature",
    properties: {
      id,
      ...meta,
      points: line.length,
      rawPoints: coords.length,
    },
    geometry: {
      type: "LineString",
      coordinates: line,
    },
  });
  console.log(`${meta.date} ${meta.name}: ${coords.length} pts → ${line.length}`);
}

const geojson = {
  type: "FeatureCollection",
  features,
};

fs.writeFileSync(outFile, JSON.stringify(geojson));
console.log(`Wrote ${features.length} tracks → ${outFile}`);
