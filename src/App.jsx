import { useState, useMemo, useCallback } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend as RLegend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ScatterChart, Scatter, ZAxis, ResponsiveContainer, LabelList,
  LineChart, Line,
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   F1 FANTASY PREDICTOR v2 — 2026
   Apple HIG · Modular Dashboard · OpenF1 Powered
   ═══════════════════════════════════════════════════════════ */

// ─── HELPERS ───
const fmt = (s) => {
  if (!s || s <= 0) return "—";
  const mins = Math.floor(s / 60);
  const secs = s - mins * 60;
  return mins > 0 ? `${mins}:${secs.toFixed(3).padStart(6, "0")}` : secs.toFixed(3);
};
const fmtSpd = (v) => (v > 0 ? `${v.toFixed(1)} km/h` : "—");

// ─── SCORING ───
const QUALI_PTS = { 1:10,2:9,3:8,4:7,5:6,6:5,7:4,8:3,9:2,10:1 };
const RACE_PTS = { 1:25,2:18,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:1 };
const SPRINT_PTS = { 1:8,2:7,3:6,4:5,5:4,6:3,7:2,8:1 };

// ─── TYRE DELTAS ───
const TYRE_DELTA = { SOFT: 0, MEDIUM: 0.7, HARD: 1.4, INTERMEDIATE: 0.3, WET: 0.5 };
const TYRE_COLORS = { SOFT: "#e10600", MEDIUM: "#f5c518", HARD: "#fff", INTERMEDIATE: "#00d26a", WET: "#3671C6" };
const TYRE_SHORT = { SOFT: "S", MEDIUM: "M", HARD: "H", INTERMEDIATE: "I", WET: "W" };

// ─── SIGNALS ───
const SIGNALS = [
  { key: "pace", label: "Pace", desc: "Best lap time", color: "#e10600", dw: 20, on: true },
  { key: "paceAdj", label: "Pace (Adj)", desc: "Tyre-adjusted best lap", color: "#ff6b6b", dw: 20, on: true },
  { key: "racePaceStint", label: "Race Pace (Stint)", desc: "Avg of detected 5+ lap stints", color: "#a855f7", dw: 15, on: true },
  { key: "racePaceAll", label: "Race Pace (All)", desc: "Avg of all non-outlier laps", color: "#c084fc", dw: 5, on: false },
  { key: "consistency", label: "Consistency", desc: "Std dev of stint laps", color: "#FF8000", dw: 10, on: true },
  { key: "sector1", label: "Sector 1", desc: "Best S1 time", color: "#00d26a", dw: 5, on: true },
  { key: "sector2", label: "Sector 2", desc: "Best S2 time", color: "#22d3ee", dw: 5, on: true },
  { key: "sector3", label: "Sector 3", desc: "Best S3 time", color: "#f59e0b", dw: 5, on: true },
  { key: "topSpeed", label: "Top Speed", desc: "Max speed trap", color: "#27F4D2", dw: 5, on: false },
  { key: "lapCount", label: "Laps Done", desc: "Reliability / running", color: "#6692FF", dw: 5, on: false },
  { key: "fastestLap", label: "Fastest Lap", desc: "Set session FL", color: "#fff", dw: 5, on: false },
];

// ─── GRID 2026 ───
const TEAMS = [
  { id: "mclaren", name: "McLaren", price: 30.0, color: "#FF8000" },
  { id: "redbull", name: "Red Bull", price: 28.5, color: "#3671C6" },
  { id: "mercedes", name: "Mercedes", price: 27.0, color: "#27F4D2" },
  { id: "ferrari", name: "Ferrari", price: 25.0, color: "#E8002D" },
  { id: "astonmartin", name: "Aston Martin", price: 14.0, color: "#229971" },
  { id: "alpine", name: "Alpine", price: 8.5, color: "#FF87BC" },
  { id: "haas", name: "Haas", price: 10.0, color: "#B6BABD" },
  { id: "racingbulls", name: "Racing Bulls", price: 6.3, color: "#6692FF" },
  { id: "williams", name: "Williams", price: 12.0, color: "#64C4FF" },
  { id: "audi", name: "Audi", price: 7.0, color: "#00E701" },
  { id: "cadillac", name: "Cadillac", price: 5.0, color: "#888" },
];

const DRIVERS = [
  { id: "VER", num: 1, name: "Max Verstappen", team: "redbull", price: 27.7 },
  { id: "NOR", num: 4, name: "Lando Norris", team: "mclaren", price: 27.2 },
  { id: "RUS", num: 63, name: "George Russell", team: "mercedes", price: 27.4 },
  { id: "PIA", num: 81, name: "Oscar Piastri", team: "mclaren", price: 25.5 },
  { id: "LEC", num: 16, name: "Charles Leclerc", team: "ferrari", price: 24.0 },
  { id: "HAM", num: 44, name: "Lewis Hamilton", team: "ferrari", price: 21.0 },
  { id: "ANT", num: 12, name: "Kimi Antonelli", team: "mercedes", price: 23.2 },
  { id: "HAD", num: 6, name: "Isack Hadjar", team: "redbull", price: 13.5 },
  { id: "GAS", num: 10, name: "Pierre Gasly", team: "alpine", price: 9.5 },
  { id: "ALO", num: 14, name: "Fernando Alonso", team: "astonmartin", price: 10.0 },
  { id: "STR", num: 18, name: "Lance Stroll", team: "astonmartin", price: 7.5 },
  { id: "BEA", num: 87, name: "Oliver Bearman", team: "haas", price: 7.0 },
  { id: "OCO", num: 31, name: "Esteban Ocon", team: "haas", price: 8.5 },
  { id: "SAI", num: 55, name: "Carlos Sainz", team: "williams", price: 11.8 },
  { id: "ALB", num: 23, name: "Alex Albon", team: "williams", price: 11.6 },
  { id: "LAW", num: 30, name: "Liam Lawson", team: "racingbulls", price: 7.0 },
  { id: "LIN", num: 40, name: "Arvid Lindblad", team: "racingbulls", price: 5.5 },
  { id: "HUL", num: 27, name: "Nico Hulkenberg", team: "audi", price: 8.0 },
  { id: "BOR", num: 5, name: "Gabriel Bortoleto", team: "audi", price: 6.5 },
  { id: "COL", num: 43, name: "Franco Colapinto", team: "alpine", price: 6.0 },
  { id: "PER", num: 11, name: "Sergio Perez", team: "cadillac", price: 6.0 },
  { id: "BOT", num: 77, name: "Valtteri Bottas", team: "cadillac", price: 5.0 },
];

const T = (id) => TEAMS.find(t => t.id === id);
const TC = (id) => T(id)?.color || "#888";
const DbyN = (n) => DRIVERS.find(d => d.num === n);

// ─── OPENF1 API ───
const API = "https://api.openf1.org/v1";
const fj = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); };

async function fetchSessions(year = 2026) {
  let ss = [];
  try { ss = await fj(`${API}/sessions?year=${year}&meeting_key=latest`); } catch {}
  if (!ss?.length) { const all = await fj(`${API}/sessions?year=${year}`); if (all?.length) { const mk = all[all.length-1].meeting_key; ss = all.filter(s => s.meeting_key === mk); } }
  if (!ss?.length) throw new Error("No sessions found");
  const map = {};
  for (const s of ss) {
    const n = (s.session_name||"").toLowerCase().trim();
    if (/practice 1|fp1/.test(n)) map.fp1 = s.session_key;
    else if (/practice 2|fp2/.test(n)) map.fp2 = s.session_key;
    else if (/practice 3|fp3/.test(n)) map.fp3 = s.session_key;
    else if (/qualifying/.test(n) && !/sprint/.test(n)) map.quali = s.session_key;
    else if (/sprint qual/.test(n)) map.sprintQuali = s.session_key;
    else if (n === "sprint") map.sprint = s.session_key;
    else if (n === "race") map.race = s.session_key;
  }
  // Fallback: type-based
  if (!map.fp1) { const ps = ss.filter(s => (s.session_type||"").toLowerCase() === "practice"); ps.forEach((p, i) => { if (i === 0 && !map.fp1) map.fp1 = p.session_key; if (i === 1 && !map.fp2) map.fp2 = p.session_key; if (i === 2 && !map.fp3) map.fp3 = p.session_key; }); }
  return { keys: map, name: ss[0]?.country_name || "Unknown GP", location: ss[0]?.location || "", raw: ss };
}

// ─── PROCESS SESSION DATA ───
async function loadSession(sk, addLog) {
  const [laps, stints, car] = await Promise.all([
    fj(`${API}/laps?session_key=${sk}`),
    fj(`${API}/stints?session_key=${sk}`).catch(() => []),
    fj(`${API}/car_data?session_key=${sk}&speed>=280`).catch(() => []),
  ]);
  if (addLog) addLog(`${laps.length} laps, ${stints.length} stints, ${car.length} car records`, "success");

  // Build tyre map: driver → [{compound, lapStart, lapEnd}]
  const tyreStints = {};
  for (const s of stints) {
    if (!tyreStints[s.driver_number]) tyreStints[s.driver_number] = [];
    tyreStints[s.driver_number].push({ compound: (s.compound||"").toUpperCase(), lapStart: s.lap_start, lapEnd: s.lap_end, age: s.tyre_age_at_start || 0 });
  }

  // Speed trap per driver
  const speeds = {};
  for (const c of car) { if (c.speed && (!speeds[c.driver_number] || c.speed > speeds[c.driver_number])) speeds[c.driver_number] = c.speed; }

  // Group laps by driver
  const byDriver = {};
  let sessionFastest = Infinity, sessionFastestDN = null;

  for (const lap of laps) {
    const dn = lap.driver_number;
    if (!byDriver[dn]) byDriver[dn] = [];
    byDriver[dn].push(lap);
    if (lap.lap_duration > 0 && !lap.is_pit_out_lap && lap.lap_duration < sessionFastest) {
      sessionFastest = lap.lap_duration; sessionFastestDN = dn;
    }
  }

  const result = {};
  for (const [dnStr, driverLaps] of Object.entries(byDriver)) {
    const dn = parseInt(dnStr);
    const d = DbyN(dn);
    if (!d) continue;

    const validLaps = driverLaps.filter(l => l.lap_duration > 0 && !l.is_pit_out_lap);
    if (validLaps.length === 0) continue;

    const times = validLaps.map(l => l.lap_duration).sort((a, b) => a - b);
    const bestLap = times[0];
    const lapCount = validLaps.length;

    // Tyre on best lap
    const bestLapObj = validLaps.find(l => l.lap_duration === bestLap);
    const bestLapNum = bestLapObj?.lap_number || 0;
    const driverStints = tyreStints[dn] || [];
    const bestLapStint = driverStints.find(s => bestLapNum >= s.lapStart && (!s.lapEnd || bestLapNum <= s.lapEnd));
    const bestLapTyre = bestLapStint?.compound || "";

    // Tyre-adjusted pace
    const delta = TYRE_DELTA[bestLapTyre] || 0;
    const paceAdj = bestLap - delta; // Lower = faster on equivalent soft pace

    // Sectors
    const s1s = validLaps.filter(l => l.duration_sector_1 > 0).map(l => l.duration_sector_1);
    const s2s = validLaps.filter(l => l.duration_sector_2 > 0).map(l => l.duration_sector_2);
    const s3s = validLaps.filter(l => l.duration_sector_3 > 0).map(l => l.duration_sector_3);

    // Stint detection: 5+ consecutive laps on same tyre
    const stintRuns = [];
    for (const stint of driverStints) {
      const stintLaps = validLaps.filter(l => l.lap_number >= stint.lapStart && (!stint.lapEnd || l.lap_number <= stint.lapEnd));
      if (stintLaps.length >= 5) {
        const stintTimes = stintLaps.map(l => l.lap_duration).sort((a, b) => a - b);
        // Remove top and bottom outlier
        const trimmed = stintTimes.length > 4 ? stintTimes.slice(1, -1) : stintTimes;
        stintRuns.push({ compound: stint.compound, laps: stintLaps.length, avg: trimmed.reduce((a, b) => a + b, 0) / trimmed.length });
      }
    }
    const racePaceStint = stintRuns.length > 0 ? Math.min(...stintRuns.map(s => s.avg)) : 0;

    // Overall race pace (all laps, top 80%)
    const topN = Math.max(2, Math.ceil(times.length * 0.8));
    const topLaps = times.slice(0, topN);
    const racePaceAll = topLaps.reduce((a, b) => a + b, 0) / topLaps.length;

    // Consistency: std dev of top laps
    const mean = topLaps.reduce((a, b) => a + b, 0) / topLaps.length;
    const consistency = Math.sqrt(topLaps.reduce((a, b) => a + (b - mean) ** 2, 0) / topLaps.length);

    // Speed trap from laps data (st_speed) or car data
    const lapSpeeds = validLaps.filter(l => l.st_speed > 0).map(l => l.st_speed);
    const topSpeed = Math.max(speeds[dn] || 0, ...lapSpeeds, 0);

    // All lap data for line chart
    const lapTimeline = validLaps.map(l => ({
      lap: l.lap_number, time: l.lap_duration,
      s1: l.duration_sector_1 || 0, s2: l.duration_sector_2 || 0, s3: l.duration_sector_3 || 0,
      speed: l.st_speed || 0,
    })).sort((a, b) => a.lap - b.lap);

    result[d.id] = {
      position: 0, // will be set by sort
      bestLap, paceAdj: +paceAdj.toFixed(3), bestLapTyre,
      racePaceStint: racePaceStint > 0 ? +racePaceStint.toFixed(3) : 0,
      racePaceAll: +racePaceAll.toFixed(3),
      consistency: +consistency.toFixed(3),
      sector1: s1s.length ? +Math.min(...s1s).toFixed(3) : 0,
      sector2: s2s.length ? +Math.min(...s2s).toFixed(3) : 0,
      sector3: s3s.length ? +Math.min(...s3s).toFixed(3) : 0,
      topSpeed, lapCount,
      fastestLap: dn === sessionFastestDN ? 1 : 0,
      stintRuns, lapTimeline,
    };
  }

  // Assign positions
  const sorted = Object.entries(result).sort((a, b) => a[1].bestLap - b[1].bestLap);
  sorted.forEach(([id], i) => { result[id].position = i + 1; });

  return result;
}

// ─── PREDICTION ENGINE ───
function computeCoefficients(sessionData, sessionWeights, signalConfig) {
  const sessions = Object.keys(sessionData).filter(k => Object.keys(sessionData[k]).length > 0);
  if (sessions.length === 0) return {};

  const activeSignals = signalConfig.filter(s => s.on);
  if (activeSignals.length === 0) return {};
  const totalSigW = activeSignals.reduce((s, x) => s + x.weight, 0);

  const sigField = { pace: "bestLap", paceAdj: "paceAdj", racePaceStint: "racePaceStint", racePaceAll: "racePaceAll", consistency: "consistency", sector1: "sector1", sector2: "sector2", sector3: "sector3", topSpeed: "topSpeed", lapCount: "lapCount", fastestLap: "fastestLap" };
  const invertSigs = new Set(["topSpeed", "lapCount", "fastestLap"]); // higher = better

  // Normalize weights for available sessions
  const rawW = sessions.map(s => sessionWeights[s] || 0);
  const totalW = rawW.reduce((a, b) => a + b, 0);
  const normW = rawW.map(w => totalW > 0 ? w / totalW : 1 / sessions.length);

  // Get all driver IDs across sessions
  const allIds = new Set();
  sessions.forEach(s => Object.keys(sessionData[s]).forEach(id => allIds.add(id)));

  // Norms per session per signal
  const norms = sessions.map(s => {
    const n = {};
    activeSignals.forEach(sig => {
      const vals = Object.values(sessionData[s]).map(d => d[sigField[sig.key]] || 0).filter(v => v > 0);
      n[sig.key] = vals.length ? { min: Math.min(...vals), max: Math.max(...vals) } : { min: 0, max: 0 };
    });
    return n;
  });

  const norm = (v, min, max, inv) => {
    if (max === min || v <= 0) return 0;
    const n = (v - min) / (max - min);
    return inv ? n : 1 - n;
  };

  const coefficients = {};
  allIds.forEach(id => {
    let composite = 0, totalEW = 0;
    const signals = {};
    let sigCounts = {};
    activeSignals.forEach(s => { signals[s.key] = 0; sigCounts[s.key] = 0; });

    sessions.forEach((s, si) => {
      const d = sessionData[s][id];
      if (!d) return;
      const maxLaps = Math.max(...Object.values(sessionData[s]).map(x => x.lapCount || 0), 1);
      const confidence = Math.min(1, (d.lapCount / maxLaps) * 1.5);
      const ew = normW[si] * (0.7 + 0.3 * confidence);

      let score = 0;
      activeSignals.forEach(sig => {
        const v = d[sigField[sig.key]] || 0;
        const inv = invertSigs.has(sig.key);
        const normalized = norm(v, norms[si][sig.key]?.min || 0, norms[si][sig.key]?.max || 0, inv);
        score += normalized * (sig.weight / totalSigW);
        signals[sig.key] += normalized;
        if (normalized > 0) sigCounts[sig.key]++;
      });

      composite += score * ew;
      totalEW += ew;
    });

    if (totalEW > 0) composite /= totalEW;
    activeSignals.forEach(sig => { signals[sig.key] = sigCounts[sig.key] > 0 ? signals[sig.key] / sigCounts[sig.key] : 0; });
    coefficients[id] = { composite: +composite.toFixed(4), signals };
  });

  return coefficients;
}

function optimizeLineups(coefficients, topN = 5) {
  const sorted = Object.entries(coefficients).sort((a, b) => b[1].composite - a[1].composite);
  const dScores = {};
  sorted.forEach(([id, c], i) => {
    const d = DRIVERS.find(x => x.id === id);
    if (d) dScores[id] = { pts: Math.max(0, Math.round(c.composite * 50)), ppm: (c.composite * 50) / d.price };
  });

  const sD = DRIVERS.map(d => ({ ...d, projPts: dScores[d.id]?.pts || 0, projPPM: dScores[d.id]?.ppm || 0 })).sort((a, b) => b.projPPM - a.projPPM);
  const sC = TEAMS.map(t => {
    const tds = DRIVERS.filter(d => d.team === t.id);
    const pts = tds.reduce((s, d) => s + (dScores[d.id]?.pts || 0), 0);
    return { ...t, projPts: Math.round(pts * 0.6), projPPM: (pts * 0.6) / t.price };
  }).sort((a, b) => b.projPPM - a.projPPM);

  const cP = [];
  for (let i = 0; i < sC.length; i++) for (let j = i + 1; j < sC.length; j++) cP.push([sC[i], sC[j]]);
  cP.sort((a, b) => (b[0].projPts + b[1].projPts) - (a[0].projPts + a[1].projPts));

  const lns = [];
  cP.slice(0, 15).forEach(([c1, c2]) => {
    const cc = c1.price + c2.price, cp = c1.projPts + c2.projPts, bl = 100 - cc;
    const pk = []; let sp = 0; const av = [...sD];
    for (let r = 0; r < 5; r++) {
      let bi = -1, bs = -Infinity;
      for (let i = 0; i < av.length; i++) {
        const d = av[i]; if (sp + d.price > bl) continue;
        if ((4 - r) > 0 && sp + d.price + (4 - r) * 5 > bl) continue;
        const sc = d.projPts * 0.6 + d.projPPM * 20 * 0.4;
        if (sc > bs) { bs = sc; bi = i; }
      }
      if (bi >= 0) { pk.push(av[bi]); sp += av[bi].price; av.splice(bi, 1); }
    }
    if (pk.length === 5) {
      const dp = pk.reduce((s, d) => s + d.projPts, 0);
      const bd = pk.reduce((b, d) => d.projPts > b.projPts ? d : b, pk[0]);
      lns.push({ drivers: pk, constructors: [c1, c2], totalCost: +(sp + cc).toFixed(1), boostedPoints: dp + cp + bd.projPts, boostDriver: bd.id, driverPts: dp, constructorPts: cp });
    }
  });

  const seen = new Set();
  return lns.filter(l => { const k = [...l.drivers.map(d => d.id).sort(), ...l.constructors.map(c => c.id).sort()].join(","); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.boostedPoints - a.boostedPoints).slice(0, topN);
}

// ─── TYRE BADGE ───
const TyreBadge = ({ compound }) => {
  if (!compound) return null;
  return <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: TYRE_COLORS[compound] || "#555", color: compound === "MEDIUM" || compound === "HARD" ? "#000" : "#fff", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{TYRE_SHORT[compound] || "?"}</span>;
};

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("home");
  const [sessionData, setSessionData] = useState({}); // { fp1: {VER: {...}, ...}, fp2: {...}, ... }
  const [meeting, setMeeting] = useState({ name: "", location: "" });
  const [apiStatus, setApiStatus] = useState({ loading: false, error: null, fetched: {} });
  const [fetchLog, setFetchLog] = useState([]);
  const addLog = (m, t = "info") => setFetchLog(p => [...p.slice(-20), { m, t, ts: new Date().toLocaleTimeString() }]);

  // Basic Stats
  const [statsSession, setStatsSession] = useState("fp1");

  // Charts
  const [chartSession, setChartSession] = useState("fp1");
  const [chartDrivers, setChartDrivers] = useState(["VER", "LEC", "NOR", "RUS", "PIA"]);

  // Team Builder
  const [myD, setMyD] = useState([]);
  const [myC, setMyC] = useState([]);
  const [search, setSearch] = useState("");

  // Predictor
  const [sigConfig, setSigConfig] = useState(SIGNALS.map(s => ({ key: s.key, on: s.on, weight: s.dw })));
  const [sesWeights, setSesWeights] = useState({ fp1: 25, fp2: 35, fp3: 40 });

  const toggleSig = k => setSigConfig(p => p.map(s => s.key === k ? { ...s, on: !s.on } : s));
  const setSigW = (k, w) => setSigConfig(p => p.map(s => s.key === k ? { ...s, weight: w } : s));

  const enrichedSigs = useMemo(() => sigConfig.map(sc => ({ ...SIGNALS.find(s => s.key === sc.key), ...sc })), [sigConfig]);

  // ─── FETCH ───
  const fetchAll = useCallback(async () => {
    setApiStatus({ loading: true, error: null, fetched: {} });
    setFetchLog([]);
    addLog("Connecting to OpenF1...");
    try {
      const { keys, name, location, raw } = await fetchSessions(2026);
      setMeeting({ name, location });
      addLog(`GP: ${name} (${location})`, "success");
      raw.forEach(s => addLog(`  ${s.session_name} [${s.session_type}] → ${s.session_key}`));
      addLog(`Matched: ${Object.keys(keys).join(", ")}`, "success");

      const data = {};
      const fetched = {};
      for (const [ses, sk] of Object.entries(keys)) {
        addLog(`Loading ${ses.toUpperCase()}...`);
        try {
          data[ses] = await loadSession(sk, (m, t) => addLog(`  ${ses.toUpperCase()}: ${m}`, t));
          fetched[ses] = true;
          addLog(`${ses.toUpperCase()}: ${Object.keys(data[ses]).length} drivers processed`, "success");
        } catch (e) { addLog(`${ses.toUpperCase()}: ${e.message}`, "error"); }
      }
      setSessionData(data);
      setApiStatus({ loading: false, error: null, fetched });
      // Auto-select first available session for stats
      const firstSes = Object.keys(fetched)[0];
      if (firstSes) { setStatsSession(firstSes); setChartSession(firstSes); }
      addLog("All data loaded.", "success");
    } catch (e) { setApiStatus({ loading: false, error: e.message, fetched: {} }); addLog(e.message, "error"); }
  }, []);

  const hasData = Object.keys(sessionData).some(k => Object.keys(sessionData[k]).length > 0);
  const availableSessions = Object.keys(apiStatus.fetched);

  // Predictor computations
  const coefficients = useMemo(() => computeCoefficients(sessionData, sesWeights, enrichedSigs), [sessionData, sesWeights, enrichedSigs]);
  const topLineups = useMemo(() => optimizeLineups(coefficients, 5), [coefficients]);
  const rankedPrediction = useMemo(() => {
    return DRIVERS.map(d => ({ ...d, coeff: coefficients[d.id]?.composite || 0, signals: coefficients[d.id]?.signals || {} })).sort((a, b) => b.coeff - a.coeff);
  }, [coefficients]);
  const maxCoeff = useMemo(() => Math.max(...rankedPrediction.map(d => d.coeff), 0.01), [rankedPrediction]);

  // Current stats data
  const currentStats = sessionData[statsSession] || {};
  const statsList = useMemo(() => {
    return DRIVERS.map(d => ({ ...d, ...(currentStats[d.id] || {}) })).filter(d => d.bestLap > 0).sort((a, b) => a.position - b.position);
  }, [currentStats]);

  // Chart: radar data
  const radarData = useMemo(() => {
    const active = enrichedSigs.filter(s => s.on);
    const sd = sessionData[chartSession] || {};
    if (!Object.keys(sd).length) return [];
    const sigField = { pace: "bestLap", paceAdj: "paceAdj", racePaceStint: "racePaceStint", racePaceAll: "racePaceAll", consistency: "consistency", sector1: "sector1", sector2: "sector2", sector3: "sector3", topSpeed: "topSpeed", lapCount: "lapCount", fastestLap: "fastestLap" };
    const invertSigs = new Set(["topSpeed", "lapCount", "fastestLap"]);
    return active.map(sig => {
      const vals = Object.values(sd).map(d => d[sigField[sig.key]] || 0).filter(v => v > 0);
      const mn = vals.length ? Math.min(...vals) : 0, mx = vals.length ? Math.max(...vals) : 0;
      const row = { signal: sig.label };
      chartDrivers.forEach(did => {
        const v = sd[did]?.[sigField[sig.key]] || 0;
        if (mx === mn || v <= 0) { row[did] = 0; return; }
        const n = (v - mn) / (mx - mn);
        row[did] = Math.round((invertSigs.has(sig.key) ? n : 1 - n) * 100);
      });
      return row;
    });
  }, [sessionData, chartSession, chartDrivers, enrichedSigs]);

  // Chart: lap timeline
  const lapTimelineData = useMemo(() => {
    const sd = sessionData[chartSession] || {};
    const maxLap = Math.max(...chartDrivers.map(id => (sd[id]?.lapTimeline || []).length), 0);
    const data = [];
    for (let i = 0; i < maxLap; i++) {
      const row = { lap: i + 1 };
      chartDrivers.forEach(id => {
        const tl = sd[id]?.lapTimeline || [];
        const lap = tl[i];
        row[id] = lap?.time || null;
      });
      data.push(row);
    }
    return data;
  }, [sessionData, chartSession, chartDrivers]);

  // Team cost
  const teamCost = useMemo(() => (myD.reduce((s, id) => s + (DRIVERS.find(d => d.id === id)?.price || 0), 0) + myC.reduce((s, id) => s + (TEAMS.find(t => t.id === id)?.price || 0), 0)).toFixed(1), [myD, myC]);

  // ─── STYLES ───
  const font = "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
  const bg = "#000"; const card = "#1c1c1e"; const card2 = "#2c2c2e"; const txt = "#f5f5f7"; const sub = "#86868b"; const border = "#38383a";
  const accent = "#e10600";
  const pill = (active, color) => ({ padding: "8px 18px", borderRadius: 20, background: active ? (color || accent) : card2, color: active ? "#fff" : sub, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: font, transition: "all 0.2s" });

  return (
    <div style={{ minHeight: "100vh", background: bg, color: txt, fontFamily: font }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${bg}}::-webkit-scrollbar-thumb{background:${border};border-radius:3px}@keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi .3s ease}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${border}}input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;cursor:pointer}`}</style>

      {/* ─── NAV ─── */}
      <nav style={{ display: "flex", alignItems: "center", gap: 4, padding: "16px 24px", background: "#0a0a0a", borderBottom: `1px solid ${border}`, overflowX: "auto", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: accent, marginRight: 16, letterSpacing: -0.5 }}>F1 Predictor</span>
        {[["home","Home"],["stats","Basic Stats"],["charts","Charts"],["team","Team Builder"],["predictor","Predictor"],["old","Old UI"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...pill(tab === k), whiteSpace: "nowrap", fontSize: 13 }}>{l}</button>
        ))}
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* ═══ HOME ═══ */}
        {tab === "home" && (
          <div className="fi">
            {/* GP Hero */}
            <div style={{ background: `linear-gradient(135deg, ${accent}22, ${card})`, border: `1px solid ${accent}44`, borderRadius: 20, padding: "40px 36px", marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
                {meeting.name ? "Current Grand Prix" : "2026 Season"}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
                {meeting.name ? `${meeting.name} Grand Prix` : "F1 Fantasy Predictor"}
              </div>
              <div style={{ fontSize: 16, color: sub }}>
                {meeting.location || "Predict race outcomes using practice session telemetry data"}
              </div>
              {!hasData && (
                <button onClick={() => { fetchAll(); setTab("stats"); }} style={{ marginTop: 24, padding: "14px 32px", background: accent, border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: font }}>
                  Fetch Live Data →
                </button>
              )}
              {hasData && <div style={{ marginTop: 16, fontSize: 13, color: sub }}>Sessions loaded: {availableSessions.map(s => s.toUpperCase()).join(" · ")}</div>}
            </div>

            {/* How it works */}
            <div style={{ background: card, borderRadius: 16, padding: 32, border: `1px solid ${border}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>How It Works</div>
              <div style={{ fontSize: 15, color: sub, lineHeight: 1.8 }}>
                This app analyzes real-time practice session data from the OpenF1 API to predict qualifying and race performance for F1 Fantasy 2026.
                The prediction engine processes multiple performance signals from FP1, FP2, and FP3 — including raw pace, tyre-adjusted pace (correcting for compound differences using fixed deltas: Soft=0s, Medium=+0.7s, Hard=+1.4s),
                stint-detected race pace (5+ consecutive laps on the same tyre set), sector times, top speed, consistency, and lap count.
                Each signal can be toggled on/off and weighted independently. Session weights are adjustable — giving you control over how much FP1 vs FP2 vs FP3 influence the prediction.
                The optimizer then finds the best 5-driver + 2-constructor combination under the $100M budget cap, ranked by projected fantasy score with a 2x boost applied to the strongest driver.
              </div>
            </div>
          </div>
        )}

        {/* ═══ BASIC STATS ═══ */}
        {tab === "stats" && (
          <div className="fi">
            {/* Fetch bar */}
            <div style={{ background: card, borderRadius: 16, padding: 20, marginBottom: 24, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Data Source</div>
                  <div style={{ fontSize: 13, color: sub, marginTop: 2 }}>{meeting.name ? `${meeting.name} GP` : "Not loaded"} · api.openf1.org</div>
                </div>
                <button onClick={fetchAll} disabled={apiStatus.loading} style={{ padding: "12px 28px", background: apiStatus.loading ? card2 : "#3671C6", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: apiStatus.loading ? "default" : "pointer", fontFamily: font, display: "flex", alignItems: "center", gap: 8 }}>
                  {apiStatus.loading && <span className="spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />}
                  {apiStatus.loading ? "Loading..." : hasData ? "Refresh" : "Fetch Data"}
                </button>
              </div>
              {fetchLog.length > 0 && <div style={{ maxHeight: 160, overflowY: "auto", background: bg, borderRadius: 10, padding: 12, marginTop: 12 }}>{fetchLog.map((l, i) => <div key={i} style={{ fontSize: 12, fontFamily: "SF Mono, monospace", padding: "2px 0", color: l.t === "error" ? accent : l.t === "success" ? "#00d26a" : sub }}><span style={{ color: border }}>[{l.ts}]</span> {l.m}</div>)}</div>}
            </div>

            {!hasData ? <div style={{ textAlign: "center", padding: 60, color: sub, fontSize: 16 }}>Click "Fetch Data" to load session results</div> : (<>
              {/* Session toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {availableSessions.map(s => (
                  <button key={s} onClick={() => setStatsSession(s)} style={pill(statsSession === s, s.includes("fp") ? "#FF8000" : s === "quali" ? "#a855f7" : "#00d26a")}>{s.toUpperCase()}</button>
                ))}
              </div>

              {/* Driver table */}
              <div style={{ background: card, borderRadius: 16, overflow: "hidden", border: `1px solid ${border}` }}>
                <div style={{ overflowX: "auto" }}>
                  <div style={{ minWidth: 720 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 44px 110px 100px 85px 85px 85px", padding: "14px 20px", background: card2, fontSize: 12, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 0.5, alignItems: "center" }}>
                      <span>Pos</span><span>Driver</span><span>Tyre</span><span>Best Lap</span><span>Top Speed</span><span>S1</span><span>S2</span><span>S3</span>
                    </div>
                    {statsList.map((d, i) => (
                      <div key={d.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr 44px 110px 100px 85px 85px 85px", padding: "14px 20px", borderTop: `1px solid ${border}`, alignItems: "center", background: i < 3 ? `${TC(d.team)}08` : "transparent" }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: i < 3 ? "#fff" : sub }}>{d.position}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 4, height: 28, borderRadius: 2, background: TC(d.team) }} />
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{d.name}</div>
                            <div style={{ fontSize: 12, color: sub }}>{T(d.team)?.name} · ${d.price}M</div>
                          </div>
                        </div>
                        <TyreBadge compound={d.bestLapTyre} />
                        <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(d.bestLap)}</span>
                        <span style={{ fontSize: 14, color: sub, fontVariantNumeric: "tabular-nums" }}>{fmtSpd(d.topSpeed)}</span>
                        <span style={{ fontSize: 13, color: sub, fontVariantNumeric: "tabular-nums" }}>{fmt(d.sector1)}</span>
                        <span style={{ fontSize: 13, color: sub, fontVariantNumeric: "tabular-nums" }}>{fmt(d.sector2)}</span>
                        <span style={{ fontSize: 13, color: sub, fontVariantNumeric: "tabular-nums" }}>{fmt(d.sector3)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>)}
          </div>
        )}

        {/* ═══ CHARTS ═══ */}
        {tab === "charts" && (
          <div className="fi">
            {!hasData ? <div style={{ textAlign: "center", padding: 60, color: sub }}>Load data in Basic Stats first</div> : (<>
              {/* Session + driver toggles */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {availableSessions.map(s => <button key={s} onClick={() => setChartSession(s)} style={pill(chartSession === s, "#FF8000")}>{s.toUpperCase()}</button>)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
                {DRIVERS.filter(d => sessionData[chartSession]?.[d.id]).map(d => (
                  <button key={d.id} onClick={() => { if (chartDrivers.includes(d.id)) setChartDrivers(chartDrivers.filter(x => x !== d.id)); else if (chartDrivers.length < 6) setChartDrivers([...chartDrivers, d.id]); }} style={{ padding: "6px 14px", borderRadius: 8, background: chartDrivers.includes(d.id) ? `${TC(d.team)}33` : card2, border: `1.5px solid ${chartDrivers.includes(d.id) ? TC(d.team) : border}`, color: chartDrivers.includes(d.id) ? "#fff" : sub, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: font }}>{d.name.split(" ").pop()}</button>
                ))}
              </div>

              {/* Radar */}
              <div style={{ background: card, borderRadius: 16, padding: 24, marginBottom: 24, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Signal Radar — {chartSession.toUpperCase()}</div>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={border} />
                    <PolarAngleAxis dataKey="signal" tick={{ fill: sub, fontSize: 12, fontFamily: font }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: border, fontSize: 10 }} />
                    {chartDrivers.map(id => { const d = DRIVERS.find(x => x.id === id); return d ? <Radar key={id} name={d.name.split(" ").pop()} dataKey={id} stroke={TC(d.team)} fill={TC(d.team)} fillOpacity={0.1} strokeWidth={2.5} /> : null; })}
                    <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 12, fontSize: 13, fontFamily: font }} />
                    <RLegend wrapperStyle={{ fontSize: 13, fontFamily: font, color: sub }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Lap timeline */}
              <div style={{ background: card, borderRadius: 16, padding: 24, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Lap Time Trace — {chartSession.toUpperCase()}</div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={lapTimelineData} margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={border} />
                    <XAxis dataKey="lap" tick={{ fill: sub, fontSize: 11 }} label={{ value: "Lap", position: "bottom", fill: sub, fontSize: 12 }} />
                    <YAxis tick={{ fill: sub, fontSize: 11 }} domain={["auto", "auto"]} label={{ value: "Time (s)", angle: -90, position: "insideLeft", fill: sub, fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, borderRadius: 12, fontSize: 12, fontFamily: font }} formatter={(v) => v ? [fmt(v), "Lap Time"] : ["—"]} />
                    {chartDrivers.map(id => { const d = DRIVERS.find(x => x.id === id); return d ? <Line key={id} type="monotone" dataKey={id} name={d.name.split(" ").pop()} stroke={TC(d.team)} strokeWidth={2} dot={false} connectNulls /> : null; })}
                    <RLegend wrapperStyle={{ fontSize: 12, fontFamily: font, color: sub }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>)}
          </div>
        )}

        {/* ═══ TEAM BUILDER ═══ */}
        {tab === "team" && (
          <div className="fi">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
              <div><div style={{ fontSize: 22, fontWeight: 700 }}>Team Builder</div><div style={{ fontSize: 14, color: sub }}>5 drivers + 2 constructors · $100M cap</div></div>
              <div style={{ fontSize: 28, fontWeight: 800, color: parseFloat(teamCost) > 100 ? accent : "#00d26a" }}>${teamCost}M</div>
            </div>
            <div style={{ height: 6, background: card2, borderRadius: 3, marginBottom: 24, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (parseFloat(teamCost) / 100) * 100)}%`, background: parseFloat(teamCost) > 100 ? accent : "linear-gradient(90deg, #00d26a, #00ff88)", borderRadius: 3, transition: "width 0.3s" }} /></div>

            {/* Selected */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {myD.map(id => { const d = DRIVERS.find(x => x.id === id); return <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: `${TC(d.team)}22`, border: `1.5px solid ${TC(d.team)}`, borderRadius: 10, fontSize: 14, fontWeight: 600 }}><div style={{ width: 4, height: 20, borderRadius: 2, background: TC(d.team) }} />{d.name.split(" ").pop()} <span style={{ color: sub, fontWeight: 400 }}>${d.price}M</span><button onClick={() => setMyD(myD.filter(x => x !== id))} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button></div>; })}
              {myC.map(id => { const t = TEAMS.find(x => x.id === id); return <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: `${t.color}22`, border: `1.5px solid ${t.color}`, borderRadius: 10, fontSize: 14, fontWeight: 600 }}><div style={{ width: 4, height: 20, borderRadius: 2, background: t.color }} />{t.name} <span style={{ color: sub, fontWeight: 400 }}>${t.price}M</span><button onClick={() => setMyC(myC.filter(x => x !== id))} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button></div>; })}
            </div>

            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drivers or teams..." style={{ width: "100%", padding: "14px 20px", background: card, border: `1px solid ${border}`, borderRadius: 12, color: txt, fontSize: 15, fontFamily: font, outline: "none", marginBottom: 20 }} />

            <div style={{ fontSize: 13, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Drivers ({myD.length}/5)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {DRIVERS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || T(d.team)?.name.toLowerCase().includes(search.toLowerCase())).map(d => (
                <button key={d.id} onClick={() => { if (myD.includes(d.id)) setMyD(myD.filter(x => x !== d.id)); else if (myD.length < 5) setMyD([...myD, d.id]); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: myD.includes(d.id) ? `${TC(d.team)}22` : card, border: `1.5px solid ${myD.includes(d.id) ? TC(d.team) : border}`, borderRadius: 12, cursor: "pointer", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: TC(d.team) }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: txt }}>{d.name}</div><div style={{ fontSize: 12, color: sub }}>{T(d.team)?.name}</div></div>
                  <span style={{ fontSize: 14, color: sub, fontWeight: 600 }}>${d.price}M</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Constructors ({myC.length}/2)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TEAMS.map(t => (
                <button key={t.id} onClick={() => { if (myC.includes(t.id)) setMyC(myC.filter(x => x !== t.id)); else if (myC.length < 2) setMyC([...myC, t.id]); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: myC.includes(t.id) ? `${t.color}22` : card, border: `1.5px solid ${myC.includes(t.id) ? t.color : border}`, borderRadius: 12, cursor: "pointer" }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: t.color }} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: txt }}>{t.name}</div></div>
                  <span style={{ fontSize: 14, color: sub, fontWeight: 600 }}>${t.price}M</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PREDICTOR + OPTIMIZER ═══ */}
        {tab === "predictor" && (
          <div className="fi">
            {!hasData ? <div style={{ textAlign: "center", padding: 60, color: sub }}>Load data first</div> : (
              <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* LEFT: Predictor */}
                <div style={{ flex: "1 1 440px", minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Predictor</div>

                  {/* Session weights */}
                  <div style={{ background: card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: sub, marginBottom: 12 }}>SESSION WEIGHTS</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {availableSessions.filter(s => s.startsWith("fp")).map(s => (
                        <div key={s} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#FF8000", marginBottom: 4 }}>{s.toUpperCase()}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{sesWeights[s] || 0}%</div>
                          <input type="range" min={0} max={100} value={sesWeights[s] || 0} onChange={e => setSesWeights(p => ({ ...p, [s]: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: "#FF8000" }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signals */}
                  <div style={{ background: card, borderRadius: 16, padding: 20, marginBottom: 16, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: sub, marginBottom: 12 }}>SIGNALS</div>
                    {SIGNALS.map(sig => {
                      const conf = sigConfig.find(s => s.key === sig.key);
                      return (
                        <div key={sig.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${border}`, opacity: conf.on ? 1 : 0.4 }}>
                          <div onClick={() => toggleSig(sig.key)} style={{ width: 40, height: 22, borderRadius: 11, background: conf.on ? sig.color : card2, position: "relative", cursor: "pointer", flexShrink: 0 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: conf.on ? 20 : 2, transition: "all 0.2s" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{sig.label}</div>
                            <div style={{ fontSize: 11, color: sub }}>{sig.desc}</div>
                          </div>
                          {conf.on && <div style={{ display: "flex", alignItems: "center", gap: 6, width: 100 }}>
                            <input type="range" min={1} max={40} value={conf.weight} onChange={e => setSigW(sig.key, parseInt(e.target.value))} style={{ flex: 1, accentColor: sig.color }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: sig.color, width: 28, textAlign: "right" }}>{conf.weight}</span>
                          </div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Rankings */}
                  <div style={{ background: card, borderRadius: 16, overflow: "hidden", border: `1px solid ${border}` }}>
                    <div style={{ padding: "14px 20px", background: card2, fontSize: 14, fontWeight: 700, color: sub }}>PREDICTED RANKING</div>
                    {rankedPrediction.filter(d => d.coeff > 0).map((d, i) => (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderTop: `1px solid ${border}` }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: i < 3 ? "#fff" : sub, width: 28 }}>{i + 1}</span>
                        <div style={{ width: 4, height: 24, borderRadius: 2, background: TC(d.team) }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{d.name.split(" ").pop()}</span>
                          <span style={{ fontSize: 12, color: sub, marginLeft: 8 }}>{T(d.team)?.name}</span>
                        </div>
                        <div style={{ width: 80, height: 6, background: card2, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(d.coeff / maxCoeff) * 100}%`, background: TC(d.team), borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, width: 40, textAlign: "right" }}>{(d.coeff * 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Optimizer */}
                <div style={{ flex: "1 1 400px", minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Optimizer</div>
                  <div style={{ fontSize: 14, color: sub, marginBottom: 16 }}>Top 5 lineups under $100M</div>

                  {topLineups.map((lu, li) => { const best = li === 0; return (
                    <div key={li} style={{ background: card, borderRadius: 16, padding: 20, marginBottom: 12, border: `2px solid ${best ? "#00d26a" : border}`, position: "relative" }}>
                      {best && <div style={{ position: "absolute", top: -1, right: 16, background: "#00d26a", color: "#000", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: "0 0 8px 8px" }}>BEST</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: best ? "#00d26a" : sub }}>#{li + 1}</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: best ? "#00d26a" : "#FF8000" }}>{lu.boostedPoints} pts</div>
                          <div style={{ fontSize: 11, color: sub }}>${lu.totalCost}M</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {lu.drivers.map(d => <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: `${TC(d.team)}22`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: TC(d.team) }} />{d.name.split(" ").pop()} {d.id === lu.boostDriver && <span style={{ fontSize: 9, background: accent, color: "#fff", padding: "1px 4px", borderRadius: 3 }}>2x</span>}</div>)}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {lu.constructors.map(c => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: `${c.color}22`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: c.color }} />{c.name}</div>)}
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ OLD UI ═══ */}
        {tab === "old" && (
          <div className="fi" style={{ textAlign: "center", padding: 60, color: sub }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Old UI</div>
            <div style={{ fontSize: 14 }}>The previous interface is preserved as a separate page. Deploy the old App.jsx alongside this new version in your project.</div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${border}`, padding: "24px 24px", textAlign: "center", marginTop: 40 }}>
        <div style={{ fontSize: 12, color: sub, marginBottom: 6 }}>F1 Fantasy Predictor · 2026 · Powered by OpenF1</div>
        <div style={{ fontSize: 13, color: sub, fontWeight: 600 }}>Built by <span style={{ color: txt }}>kiweeone</span></div>
      </div>
    </div>
  );
}
