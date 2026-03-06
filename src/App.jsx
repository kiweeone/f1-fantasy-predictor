import { useState, useMemo, useCallback } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend as RLegend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ScatterChart, Scatter, ZAxis, ResponsiveContainer, LabelList } from "recharts";

// ─── SCORING RULES ───
const QUALI_POINTS = { 1:10,2:9,3:8,4:7,5:6,6:5,7:4,8:3,9:2,10:1 };
const RACE_POINTS = { 1:25,2:18,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:1 };
const SPRINT_POINTS = { 1:8,2:7,3:6,4:5,5:4,6:3,7:2,8:1 };
const PIT_POINTS = [
  { label: "<2.0s", min: 0, max: 1.99, pts: 10 }, { label: "2.0–2.19s", min: 2.0, max: 2.19, pts: 10 },
  { label: "2.2–2.49s", min: 2.2, max: 2.49, pts: 5 }, { label: "2.5–2.99s", min: 2.5, max: 2.99, pts: 2 },
  { label: "3.0s+", min: 3.0, max: 99, pts: 0 },
];

// ─── SIGNAL DEFINITIONS ───
const ALL_SIGNALS = [
  { key: "pace", label: "Pace", desc: "Best lap vs session best", color: "#e10600", defaultWeight: 25, defaultOn: true, invert: false },
  { key: "consistency", label: "Consistency", desc: "Std dev of top 80% laps", color: "#FF8000", defaultWeight: 15, defaultOn: true, invert: false },
  { key: "longRun", label: "Long Run", desc: "Average pace laps 4+", color: "#a855f7", defaultWeight: 15, defaultOn: true, invert: false },
  { key: "lapCount", label: "Laps", desc: "Total laps completed", color: "#6692FF", defaultWeight: 5, defaultOn: true, invert: true },
  { key: "sector1", label: "Sector 1", desc: "Best S1 time", color: "#00d26a", defaultWeight: 10, defaultOn: true, invert: false },
  { key: "sector2", label: "Sector 2", desc: "Best S2 time", color: "#22d3ee", defaultWeight: 10, defaultOn: true, invert: false },
  { key: "sector3", label: "Sector 3", desc: "Best S3 time", color: "#f59e0b", defaultWeight: 10, defaultOn: true, invert: false },
  { key: "tyre", label: "Tyre", desc: "Softer compound = higher score", color: "#FF87BC", defaultWeight: 5, defaultOn: false, invert: true },
  { key: "fastLap", label: "Fastest Lap", desc: "Set session fastest lap", color: "#fff", defaultWeight: 3, defaultOn: false, invert: true },
  { key: "speedTrap", label: "Speed Trap", desc: "Max speed (km/h)", color: "#27F4D2", defaultWeight: 2, defaultOn: false, invert: true },
];

const DEFAULT_SESSION_WEIGHTS = { fp1: 33, fp2: 33, fp3: 34 };

// ─── 2026 GRID ───
const TEAMS = [
  { id: "mclaren", name: "McLaren", price: 30.0, engine: "Mercedes", color: "#FF8000" },
  { id: "redbull", name: "Red Bull", price: 28.5, engine: "Ford", color: "#3671C6" },
  { id: "mercedes", name: "Mercedes", price: 27.0, engine: "Mercedes", color: "#27F4D2" },
  { id: "ferrari", name: "Ferrari", price: 25.0, engine: "Ferrari", color: "#E8002D" },
  { id: "astonmartin", name: "Aston Martin", price: 14.0, engine: "Honda", color: "#229971" },
  { id: "alpine", name: "Alpine", price: 8.5, engine: "Mercedes", color: "#FF87BC" },
  { id: "haas", name: "Haas", price: 10.0, engine: "Ferrari", color: "#B6BABD" },
  { id: "racingbulls", name: "Racing Bulls", price: 6.3, engine: "Ford", color: "#6692FF" },
  { id: "williams", name: "Williams", price: 12.0, engine: "Mercedes", color: "#64C4FF" },
  { id: "audi", name: "Audi", price: 7.0, engine: "Audi", color: "#00E701" },
  { id: "cadillac", name: "Cadillac", price: 5.0, engine: "Ferrari", color: "#1E1E1E" },
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

const CHIPS = [
  { id: "wildcard", name: "Wildcard", desc: "Unlimited free transfers (from R2)", icon: "🔄" },
  { id: "noneg", name: "No Negative", desc: "Negative points set to zero", icon: "🛡️" },
  { id: "3xboost", name: "3x Boost", desc: "Triple points for one driver", icon: "⚡" },
  { id: "autopilot", name: "Autopilot", desc: "Auto 2x to highest scorer", icon: "🤖" },
  { id: "limitless", name: "Limitless", desc: "No budget cap + unlimited transfers", icon: "♾️" },
  { id: "finalfix", name: "Final Fix", desc: "Post-quali driver swap", icon: "🔧" },
];

const getTeam = (tid) => TEAMS.find((t) => t.id === tid);
const getTC = (tid) => getTeam(tid)?.color || "#666";
const driverByNum = (n) => DRIVERS.find((d) => d.num === n);
const numToId = (n) => driverByNum(n)?.id;

// ─── OPENF1 API ───
const API = "https://api.openf1.org/v1";
async function fetchJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); }

async function fetchSessionKeys(year = 2026) {
  let sessions = [];
  try { sessions = await fetchJSON(`${API}/sessions?year=${year}&meeting_key=latest`); } catch (e) {}
  if (!sessions || sessions.length === 0) {
    const all = await fetchJSON(`${API}/sessions?year=${year}`);
    if (all?.length > 0) { const mk = all[all.length - 1].meeting_key; sessions = all.filter(s => s.meeting_key === mk); }
  }
  if (!sessions?.length) throw new Error(`No sessions found for ${year}.`);
  const fp = {};
  for (const s of sessions) {
    const name = (s.session_name || "").toLowerCase().trim();
    if (name === "practice 1" || name === "fp1" || name === "free practice 1") fp.fp1 = s.session_key;
    else if (name === "practice 2" || name === "fp2" || name === "free practice 2") fp.fp2 = s.session_key;
    else if (name === "practice 3" || name === "fp3" || name === "free practice 3") fp.fp3 = s.session_key;
  }
  if (Object.keys(fp).length === 0) {
    const ps = sessions.filter(s => (s.session_type || "").toLowerCase() === "practice");
    if (ps.length >= 1) fp.fp1 = ps[0].session_key;
    if (ps.length >= 2) fp.fp2 = ps[1].session_key;
    if (ps.length >= 3) fp.fp3 = ps[2].session_key;
  }
  return { keys: fp, meetingName: sessions[0]?.country_name || "Unknown GP", rawSessions: sessions };
}

async function fetchLaps(sk) { return fetchJSON(`${API}/laps?session_key=${sk}`); }
async function fetchStints(sk) { try { return await fetchJSON(`${API}/stints?session_key=${sk}`); } catch { return []; } }
async function fetchCarData(sk) { try { return await fetchJSON(`${API}/car_data?session_key=${sk}&speed>=300`); } catch { return []; } }

// Tyre compound scoring: lower number = softer = more representative
const TYRE_SCORE = { SOFT: 3, MEDIUM: 2, HARD: 1, INTERMEDIATE: 1.5, WET: 1 };

function processLaps(laps, stints = [], carData = []) {
  const byDriver = {};
  for (const lap of laps) {
    const dn = lap.driver_number;
    if (!byDriver[dn]) byDriver[dn] = { laps: [], sectors: [], rawLaps: [] };
    if (lap.lap_duration && lap.lap_duration > 0) byDriver[dn].laps.push(lap.lap_duration);
    byDriver[dn].rawLaps.push(lap);
    if (lap.duration_sector_1 && lap.duration_sector_2 && lap.duration_sector_3) {
      byDriver[dn].sectors.push({ s1: lap.duration_sector_1, s2: lap.duration_sector_2, s3: lap.duration_sector_3 });
    }
  }

  // Build tyre map per driver from stints
  const tyreMap = {};
  for (const stint of stints) {
    const dn = stint.driver_number;
    const compound = (stint.compound || "").toUpperCase();
    if (compound && TYRE_SCORE[compound]) {
      if (!tyreMap[dn] || TYRE_SCORE[compound] > (TYRE_SCORE[tyreMap[dn]] || 0)) {
        tyreMap[dn] = compound;
      }
    }
  }

  // Build speed trap map
  const speedMap = {};
  for (const cd of carData) {
    const dn = cd.driver_number;
    if (cd.speed && (!speedMap[dn] || cd.speed > speedMap[dn])) speedMap[dn] = cd.speed;
  }

  // Find session fastest lap
  let sessionFastest = Infinity;
  let sessionFastestDriver = null;
  for (const [dn, data] of Object.entries(byDriver)) {
    const best = Math.min(...data.laps);
    if (best < sessionFastest) { sessionFastest = best; sessionFastestDriver = parseInt(dn); }
  }

  const result = {};
  for (const [dn, data] of Object.entries(byDriver)) {
    const driverId = numToId(parseInt(dn));
    if (!driverId || data.laps.length === 0) continue;
    const sorted = [...data.laps].sort((a, b) => a - b);
    const bestLap = sorted[0];
    const lapCount = data.laps.length;

    const topN = Math.max(2, Math.ceil(lapCount * 0.8));
    const topLaps = sorted.slice(0, topN);
    const mean = topLaps.reduce((a, b) => a + b, 0) / topLaps.length;
    const variance = topLaps.reduce((a, b) => a + (b - mean) ** 2, 0) / topLaps.length;
    const consistency = Math.sqrt(variance);

    const longRunLaps = lapCount > 5 ? sorted.slice(3) : sorted;
    const longRunPace = longRunLaps.reduce((a, b) => a + b, 0) / longRunLaps.length;

    // Sectors
    const bestS1 = data.sectors.length > 0 ? Math.min(...data.sectors.map(s => s.s1)) : 0;
    const bestS2 = data.sectors.length > 0 ? Math.min(...data.sectors.map(s => s.s2)) : 0;
    const bestS3 = data.sectors.length > 0 ? Math.min(...data.sectors.map(s => s.s3)) : 0;

    // Tyre, speed, fastest
    const tyre = tyreMap[parseInt(dn)] || "";
    const tyreScore = TYRE_SCORE[tyre] || 0;
    const speedTrap = speedMap[parseInt(dn)] || 0;
    const fastLap = parseInt(dn) === sessionFastestDriver ? 1 : 0;

    result[driverId] = {
      bestLap: +bestLap.toFixed(3), consistency: +consistency.toFixed(3), longRunPace: +longRunPace.toFixed(3),
      lapCount, sector1: +bestS1.toFixed(3), sector2: +bestS2.toFixed(3), sector3: +bestS3.toFixed(3),
      tyre, tyreScore, speedTrap, fastLap,
    };
  }
  return result;
}

// ─── PREDICTION ENGINE (signal-aware) ───
function computeCoefficients(fpData, sessionWeights, signalConfig) {
  const sessions = ["fp1", "fp2", "fp3"];
  const rawW = [sessionWeights.fp1, sessionWeights.fp2, sessionWeights.fp3];
  const driverIds = Object.keys(fpData);
  const activeSessions = sessions.filter(s => driverIds.some(id => fpData[id]?.[s]?.bestLap > 0));
  if (activeSessions.length === 0) return {};

  const activeRawW = activeSessions.map(ses => rawW[sessions.indexOf(ses)]);
  const totalRawW = activeRawW.reduce((a, b) => a + b, 0);
  const baseW = activeRawW.map(w => totalRawW > 0 ? w / totalRawW : 1 / activeSessions.length);

  // Active signals only
  const activeSignals = signalConfig.filter(s => s.on);
  const totalSigW = activeSignals.reduce((s, sig) => s + sig.weight, 0);

  const maxLaps = {};
  activeSessions.forEach(s => { maxLaps[s] = Math.max(...driverIds.map(id => fpData[id]?.[s]?.lapCount || 0), 1); });

  // Signal key to fpData field mapping
  const sigField = { pace: "bestLap", consistency: "consistency", longRun: "longRunPace", lapCount: "lapCount", sector1: "sector1", sector2: "sector2", sector3: "sector3", tyre: "tyreScore", fastLap: "fastLap", speedTrap: "speedTrap" };

  // Compute norms per session per signal
  const norms = activeSessions.map(s => {
    const active = driverIds.filter(id => fpData[id]?.[s]?.bestLap > 0);
    const n = {};
    activeSignals.forEach(sig => {
      const field = sigField[sig.key];
      const vals = active.map(id => fpData[id]?.[s]?.[field] || 0).filter(v => v > 0);
      n[sig.key] = { min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 0 };
    });
    return n;
  });

  const norm = (val, min, max, invert) => {
    if (max === min || val <= 0) return 0;
    const n = (val - min) / (max - min);
    return invert ? n : 1 - n;
  };

  const coefficients = {};
  driverIds.forEach(id => {
    let composite = 0, totalEW = 0;
    const sessionScores = [];
    const signalValues = {};
    activeSignals.forEach(sig => { signalValues[sig.key] = 0; });

    activeSessions.forEach((s, si) => {
      const d = fpData[id]?.[s];
      if (!d || d.bestLap <= 0) {
        sessionScores.push({ session: s, signals: {}, score: 0, confidence: 0 });
        return;
      }
      const sigs = {};
      let score = 0;
      activeSignals.forEach(sig => {
        const field = sigField[sig.key];
        const val = d[field] || 0;
        const normalized = norm(val, norms[si][sig.key]?.min || 0, norms[si][sig.key]?.max || 0, sig.invert);
        sigs[sig.key] = +normalized.toFixed(3);
        score += normalized * (totalSigW > 0 ? sig.weight / totalSigW : 0);
        signalValues[sig.key] += normalized;
      });

      const confidence = Math.min(1, (d.lapCount / maxLaps[s]) * 1.5);
      const ew = baseW[si] * (0.7 + 0.3 * confidence);
      sessionScores.push({ session: s, signals: sigs, score: +score.toFixed(4), confidence: +confidence.toFixed(2) });
      composite += score * ew;
      totalEW += ew;
    });

    if (totalEW > 0) composite /= totalEW;
    // Average signal values across sessions for radar chart
    const avgSignals = {};
    activeSignals.forEach(sig => { avgSignals[sig.key] = +(signalValues[sig.key] / Math.max(1, activeSessions.length)).toFixed(3); });

    coefficients[id] = { composite: +composite.toFixed(4), sessions: sessionScores, signals: avgSignals };
  });
  return coefficients;
}

function predictPositions(coefficients) {
  const entries = Object.entries(coefficients).filter(([, v]) => v.composite > 0);
  const sorted = entries.sort((a, b) => b[1].composite - a[1].composite).map(([id], i) => ({ id, predictedQuali: i + 1, predictedRace: i + 1 }));
  const rng = ((s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(777);
  sorted.forEach((d, i) => { if (i > 2 && i < sorted.length - 3) d.predictedRace = Math.max(1, Math.min(sorted.length, d.predictedRace + Math.round((rng() - 0.45) * 2))); });
  const rs = [...sorted].sort((a, b) => a.predictedRace - b.predictedRace);
  rs.forEach((d, i) => { d.predictedRace = i + 1; });
  const map = {};
  DRIVERS.forEach(d => { map[d.id] = { id: d.id, predictedQuali: 22, predictedRace: 22 }; });
  sorted.forEach(d => { map[d.id] = d; });
  return map;
}

function projectFantasyPoints(id, qP, rP) {
  let p = (QUALI_POINTS[qP] || 0) + (RACE_POINTS[rP] || 0);
  const g = qP - rP; p += g + Math.max(0, g);
  if (rP <= 3) p += 1;
  return p;
}

function projectConstructorPoints(team, preds) {
  const tds = DRIVERS.filter(d => d.team === team.id);
  let p = 0;
  const qPs = tds.map(d => preds[d.id]?.predictedQuali || 22);
  const rPs = tds.map(d => preds[d.id]?.predictedRace || 22);
  const inQ3 = qPs.filter(x => x <= 10).length, inQ2 = qPs.filter(x => x <= 15).length;
  if (inQ3 >= 2) p += 10; else if (inQ2 >= 2) p += 5; else if (inQ3 >= 1) p += 3; else if (inQ2 >= 1) p += 1; else p -= 1;
  rPs.forEach(x => { p += RACE_POINTS[x] || 0; });
  p += TEAMS.findIndex(t => t.id === team.id) <= 3 ? 8 : TEAMS.findIndex(t => t.id === team.id) <= 6 ? 4 : 1;
  return p;
}

function optimizeLineups(preds, coeffs, topN = 5) {
  const ds = {}; DRIVERS.forEach(d => { const p = preds[d.id]; if (p) { const pts = projectFantasyPoints(d.id, p.predictedQuali, p.predictedRace); ds[d.id] = { pts, ppm: pts / d.price }; } });
  const cs = {}; TEAMS.forEach(t => { const pts = projectConstructorPoints(t, preds); cs[t.id] = { pts, ppm: pts / t.price }; });
  const sD = DRIVERS.map(d => ({ ...d, projPts: ds[d.id]?.pts || 0, projPPM: ds[d.id]?.ppm || 0 })).sort((a, b) => b.projPPM - a.projPPM);
  const sC = TEAMS.map(t => ({ ...t, projPts: cs[t.id]?.pts || 0, projPPM: cs[t.id]?.ppm || 0 })).sort((a, b) => b.projPPM - a.projPPM);
  const cP = []; for (let i = 0; i < sC.length; i++) for (let j = i + 1; j < sC.length; j++) cP.push([sC[i], sC[j]]);
  cP.sort((a, b) => (b[0].projPts + b[1].projPts) - (a[0].projPts + a[1].projPts));
  const lns = [];
  cP.slice(0, 20).forEach(([c1, c2]) => {
    const cc = c1.price + c2.price, cp = c1.projPts + c2.projPts, bl = 100 - cc;
    const pk = []; let sp = 0; const av = [...sD];
    for (let r = 0; r < 5; r++) { let bi = -1, bs = -Infinity; for (let i = 0; i < av.length; i++) { const d = av[i]; if (sp + d.price > bl) continue; if ((4 - r) > 0 && sp + d.price + (4 - r) * 5 > bl) continue; const sc = d.projPts * 0.6 + d.projPPM * 20 * 0.4; if (sc > bs) { bs = sc; bi = i; } } if (bi >= 0) { pk.push(av[bi]); sp += av[bi].price; av.splice(bi, 1); } }
    if (pk.length === 5) { const dp = pk.reduce((s, d) => s + d.projPts, 0), tot = dp + cp, tc = +(sp + cc).toFixed(1); const bd = pk.reduce((b, d) => d.projPts > b.projPts ? d : b, pk[0]); lns.push({ drivers: pk, constructors: [c1, c2], totalCost: tc, projPoints: +tot.toFixed(1), boostedPoints: +(tot + bd.projPts).toFixed(1), boostDriver: bd.id, driverPts: +dp.toFixed(1), constructorPts: +cp.toFixed(1) }); }
  });
  const seen = new Set();
  return lns.filter(l => { const k = [...l.drivers.map(d => d.id).sort(), ...l.constructors.map(c => c.id).sort()].join(","); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.boostedPoints - a.boostedPoints).slice(0, topN);
}

function calcDriverScore(inp) {
  let t = 0, bd = [];
  const qP = QUALI_POINTS[inp.qualiPos] || 0;
  if (inp.qualiPos === 0) { bd.push({ l: "Quali NC/DSQ", p: -5 }); t -= 5; } else if (qP) { bd.push({ l: `Quali P${inp.qualiPos}`, p: qP }); t += qP; }
  if (inp.dnf) { bd.push({ l: "DNF/DSQ", p: -20 }); t -= 20; } else { const rP = RACE_POINTS[inp.racePos] || 0; if (rP) { bd.push({ l: `Race P${inp.racePos}`, p: rP }); t += rP; } if (inp.qualiPos > 0 && inp.racePos > 0) { const g = inp.qualiPos - inp.racePos; if (g !== 0) { bd.push({ l: `${g > 0 ? "+" : ""}${g} pos`, p: g }); t += g; } } if (inp.overtakes > 0) { bd.push({ l: `${inp.overtakes} OT`, p: inp.overtakes }); t += inp.overtakes; } }
  if (inp.fastestLap) { bd.push({ l: "FL", p: 10 }); t += 10; } if (inp.dotd) { bd.push({ l: "DOTD", p: 10 }); t += 10; }
  if (inp.sprintPos > 0) { const sP = SPRINT_POINTS[inp.sprintPos] || 0; if (sP) { bd.push({ l: `Spr P${inp.sprintPos}`, p: sP }); t += sP; } }
  if (inp.sprintDnf) { bd.push({ l: "Spr DNF", p: -10 }); t -= 10; }
  return { total: t, breakdown: bd };
}

// ─── UI ───
const S = {
  card: { background: "#12141a", border: "1px solid #2d3139", borderRadius: 12, padding: 20, marginBottom: 16 },
  lbl: (c) => ({ fontSize: 11, fontWeight: 800, color: c || "#8a8f98", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }),
  sub: { fontSize: 11, color: "#6b7280", lineHeight: 1.65 },
  inp: { padding: "8px 6px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 6, color: "#fff", fontFamily: "'Titillium Web', sans-serif", fontSize: 13, textAlign: "center", outline: "none", width: "100%" },
};
const Tab = ({ active, onClick, children, color }) => <button onClick={onClick} style={{ padding: "10px 14px", background: active ? (color || "#e10600") : "transparent", color: active ? "#fff" : "#8a8f98", border: "none", borderBottom: active ? `3px solid ${color || "#e10600"}` : "3px solid transparent", cursor: "pointer", fontFamily: "'Titillium Web', sans-serif", fontWeight: active ? 700 : 400, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", borderRadius: active ? "6px 6px 0 0" : "0", whiteSpace: "nowrap" }}>{children}</button>;
const Toggle = ({ value, onChange, label, color }) => <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: value ? (color || "#e10600") : "#8a8f98", fontWeight: value ? 700 : 400 }}><div onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? (color || "#e10600") : "#2d3139", position: "relative", cursor: "pointer", flexShrink: 0 }}><div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: value ? 18 : 2, transition: "all 0.2s" }} /></div>{label}</label>;
const NumInput = ({ value, onChange, min = 0, max = 22, label }) => <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{label && <label style={{ fontSize: 10, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>}<input type="number" value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, parseFloat(e.target.value) || 0)))} min={min} max={max} step="any" style={S.inp} /></div>;
const ScoreCard = ({ label, value, sub, color }) => <div style={{ background: "#12141a", border: "1px solid #2d3139", borderRadius: 10, padding: "14px 16px", textAlign: "center", minWidth: 90, flex: 1 }}><div style={{ fontSize: 10, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div><div style={{ fontSize: 26, fontWeight: 900, color: color || (value >= 0 ? "#00d26a" : "#e10600"), fontFamily: "'Titillium Web', sans-serif", lineHeight: 1 }}>{value}</div>{sub && <div style={{ fontSize: 10, color: "#8a8f98", marginTop: 3 }}>{sub}</div>}</div>;
const CoeffBar = ({ value, maxVal, color }) => <div style={{ height: 6, background: "#1a1d24", borderRadius: 3, overflow: "hidden", flex: 1 }}><div style={{ height: "100%", width: `${Math.min(100, (value / (maxVal || 1)) * 100)}%`, background: color || "#e10600", borderRadius: 3, transition: "width 0.4s" }} /></div>;

// ─── MAIN APP ───
export default function F1FantasyPredictor() {
  const [tab, setTab] = useState("predict");
  const [fpData, setFpData] = useState({});
  const [editingDriver, setEditingDriver] = useState("VER");
  const [isSprint, setIsSprint] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("VER");
  const [driverInput, setDriverInput] = useState({ qualiPos: 1, racePos: 1, dnf: false, overtakes: 3, fastestLap: false, dotd: false, sprintPos: 0, sprintQualiPos: 0, sprintOvertakes: 0, sprintFastestLap: false, sprintDnf: false });
  const [boost, setBoost] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  // Signal controls: each signal has { on: bool, weight: number }
  const [signalConfig, setSignalConfig] = useState(ALL_SIGNALS.map(s => ({ key: s.key, on: s.defaultOn, weight: s.defaultWeight })));
  const [sessionWeights, setSessionWeights] = useState({ ...DEFAULT_SESSION_WEIGHTS });
  const [chartView, setChartView] = useState("radar"); // radar | bar | scatter
  const [radarDrivers, setRadarDrivers] = useState(["VER", "LEC", "RUS", "NOR", "PIA"]);

  const [myDrivers, setMyDrivers] = useState(["VER", "BEA", "GAS", "LIN", "BOT"]);
  const [myConstructors, setMyConstructors] = useState(["ferrari", "racingbulls"]);
  const [driverSearch, setDriverSearch] = useState("");

  const [apiStatus, setApiStatus] = useState({ loading: false, error: null, meetingName: null, fetched: {} });
  const [fetchLog, setFetchLog] = useState([]);
  const addLog = (msg, type = "info") => setFetchLog(prev => [...prev.slice(-15), { msg, type, time: new Date().toLocaleTimeString() }]);

  const toggleSignal = (key) => setSignalConfig(prev => prev.map(s => s.key === key ? { ...s, on: !s.on } : s));
  const setSignalWeight = (key, w) => setSignalConfig(prev => prev.map(s => s.key === key ? { ...s, weight: w } : s));

  // ─── FETCH ───
  const fetchFPData = useCallback(async () => {
    setApiStatus(prev => ({ ...prev, loading: true, error: null }));
    addLog("Connecting to OpenF1 API...");
    try {
      addLog("Fetching sessions...");
      const { keys, meetingName, rawSessions } = await fetchSessionKeys(2026);
      addLog(`Meeting: ${meetingName}`, "success");
      rawSessions.forEach(s => addLog(`  → ${s.session_name} [${s.session_type}] key:${s.session_key}`));
      addLog(`Matched: ${Object.keys(keys).map(k => k.toUpperCase()).join(", ") || "none"}`, Object.keys(keys).length > 0 ? "success" : "error");
      if (Object.keys(keys).length === 0) throw new Error("No practice sessions found.");

      const newFP = {};
      DRIVERS.forEach(d => { newFP[d.id] = { fp1: {}, fp2: {}, fp3: {} }; });
      const fetched = {};

      for (const [ses, sk] of Object.entries(keys)) {
        addLog(`Fetching ${ses.toUpperCase()} laps + stints + car data...`);
        try {
          const [laps, stints, carData] = await Promise.all([fetchLaps(sk), fetchStints(sk), fetchCarData(sk)]);
          addLog(`${ses.toUpperCase()}: ${laps.length} laps, ${stints.length} stints, ${carData.length} car records`, "success");
          const processed = processLaps(laps, stints, carData);
          for (const [did, signals] of Object.entries(processed)) { if (newFP[did]) newFP[did][ses] = signals; }
          fetched[ses] = true;
        } catch (err) { addLog(`${ses.toUpperCase()}: ${err.message}`, "error"); }
      }
      setFpData(newFP);
      setApiStatus({ loading: false, error: null, meetingName, fetched });
      addLog("Done. Predictions updated.", "success");
    } catch (err) { setApiStatus(prev => ({ ...prev, loading: false, error: err.message })); addLog(`Error: ${err.message}`, "error"); }
  }, []);

  // Enriched signal config for engine
  const enrichedSignals = useMemo(() => signalConfig.map(sc => {
    const def = ALL_SIGNALS.find(s => s.key === sc.key);
    return { ...def, ...sc };
  }), [signalConfig]);

  const coefficients = useMemo(() => computeCoefficients(fpData, sessionWeights, enrichedSignals), [fpData, sessionWeights, enrichedSignals]);
  const predictions = useMemo(() => predictPositions(coefficients), [coefficients]);
  const topLineups = useMemo(() => optimizeLineups(predictions, coefficients, 5), [predictions, coefficients]);
  const maxCoeff = useMemo(() => { const v = Object.values(coefficients).map(c => c.composite); return v.length ? Math.max(...v) : 1; }, [coefficients]);
  const hasData = Object.keys(coefficients).length > 0;

  const rankedDrivers = useMemo(() => DRIVERS.map(d => ({
    ...d, coeff: coefficients[d.id]?.composite || 0,
    pred: predictions[d.id] || { predictedQuali: 22, predictedRace: 22 },
    projPts: projectFantasyPoints(d.id, predictions[d.id]?.predictedQuali || 22, predictions[d.id]?.predictedRace || 22),
    signals: coefficients[d.id]?.signals || {},
  })).sort((a, b) => b.coeff - a.coeff), [coefficients, predictions]);

  // Chart data
  const radarData = useMemo(() => {
    const active = enrichedSignals.filter(s => s.on);
    return active.map(sig => {
      const row = { signal: sig.label };
      radarDrivers.forEach(did => { row[did] = Math.round((coefficients[did]?.signals?.[sig.key] || 0) * 100); });
      return row;
    });
  }, [coefficients, enrichedSignals, radarDrivers]);

  const barData = useMemo(() => rankedDrivers.filter(d => d.coeff > 0).slice(0, 15).map(d => ({
    name: d.name.split(" ").pop(), coeff: +(d.coeff * 100).toFixed(1), fill: getTC(d.team), price: d.price, pts: d.projPts
  })), [rankedDrivers]);

  const scatterData = useMemo(() => rankedDrivers.filter(d => d.coeff > 0).map(d => ({
    x: d.price, y: d.projPts, z: d.coeff * 100, name: d.name.split(" ").pop(), fill: getTC(d.team), id: d.id,
  })), [rankedDrivers]);

  const teamCost = useMemo(() => { const dc = myDrivers.reduce((s, id) => s + (DRIVERS.find(d => d.id === id)?.price || 0), 0); return (dc + myConstructors.reduce((s, id) => s + (TEAMS.find(t => t.id === id)?.price || 0), 0)).toFixed(1); }, [myDrivers, myConstructors]);
  const toggleDriver = (id) => { if (myDrivers.includes(id)) setMyDrivers(myDrivers.filter(d => d !== id)); else if (myDrivers.length < 5) setMyDrivers([...myDrivers, id]); };
  const toggleConstructor = (id) => { if (myConstructors.includes(id)) setMyConstructors(myConstructors.filter(c => c !== id)); else if (myConstructors.length < 2) setMyConstructors([...myConstructors, id]); };
  const filteredDrivers = DRIVERS.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()) || getTeam(d.team)?.name.toLowerCase().includes(driverSearch.toLowerCase()));
  const updateFP = (dId, ses, field, val) => setFpData(prev => ({ ...prev, [dId]: { ...prev[dId], [ses]: { ...(prev[dId]?.[ses] || {}), [field]: val } } }));

  const drv = DRIVERS.find(d => d.id === selectedDriver);
  const ds = calcDriverScore(driverInput);
  const fs = boost ? ds.total * 2 : activeChip === "3xboost" ? ds.total * 3 : ds.total;
  const nn = activeChip === "noneg" ? Math.max(0, fs) : fs;

  // Toggle radar driver
  const toggleRadarDriver = (id) => {
    if (radarDrivers.includes(id)) setRadarDrivers(radarDrivers.filter(d => d !== id));
    else if (radarDrivers.length < 6) setRadarDrivers([...radarDrivers, id]);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f13", color: "#fff", fontFamily: "'Titillium Web', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#12141a}::-webkit-scrollbar-thumb{background:#2d3139;border-radius:3px}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fadeIn 0.25s ease-out}select{appearance:none}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}input[type=range]{height:4px;border-radius:2px}`}</style>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #e10600 0%, #7a0200 100%)", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -10, width: 160, height: 160, border: "30px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>F1</span><span style={{ fontSize: 13, fontWeight: 300, opacity: 0.85, letterSpacing: 2, textTransform: "uppercase" }}>Fantasy Predictor</span></div>
          <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 600, letterSpacing: 1.5, marginTop: 2 }}>2026 · {enrichedSignals.filter(s => s.on).length} SIGNALS · OPENF1 LIVE{apiStatus.meetingName ? ` · ${apiStatus.meetingName.toUpperCase()}` : ""}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: "#12141a", borderBottom: "1px solid #2d3139", overflowX: "auto", padding: "0 4px" }}>
        <Tab active={tab === "predict"} onClick={() => setTab("predict")} color="#FF8000">Predictor</Tab>
        <Tab active={tab === "charts"} onClick={() => setTab("charts")} color="#a855f7">Charts</Tab>
        <Tab active={tab === "optimizer"} onClick={() => setTab("optimizer")} color="#00d26a">Optimizer</Tab>
        <Tab active={tab === "team"} onClick={() => setTab("team")} color="#E8002D">Team</Tab>
        <Tab active={tab === "calculator"} onClick={() => setTab("calculator")}>Calc</Tab>
        <Tab active={tab === "rules"} onClick={() => setTab("rules")} color="#6692FF">Rules</Tab>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 14px" }}>
        {/* FETCH BUTTON */}
        {(tab === "predict" || tab === "charts") && (
          <div style={{ ...S.card, background: "linear-gradient(135deg, #1a1d24, #12141a)", border: "1px solid #3671C6", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: fetchLog.length > 0 ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#3671C6", textTransform: "uppercase", letterSpacing: 1 }}>OpenF1 Live Data</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{apiStatus.meetingName ? `${apiStatus.meetingName} · ${Object.keys(apiStatus.fetched).map(s => s.toUpperCase()).join(", ")}` : "Fetch FP data from api.openf1.org"}</div>
              </div>
              <button onClick={fetchFPData} disabled={apiStatus.loading} style={{ padding: "10px 20px", background: apiStatus.loading ? "#2d3139" : "#3671C6", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: apiStatus.loading ? "default" : "pointer", fontFamily: "'Titillium Web', sans-serif", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {apiStatus.loading && <span className="spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />}
                {apiStatus.loading ? "Fetching..." : hasData ? "Refresh" : "Fetch FP Data"}
              </button>
            </div>
            {fetchLog.length > 0 && <div style={{ maxHeight: 120, overflowY: "auto", background: "#0d0f13", borderRadius: 6, padding: 8 }}>{fetchLog.map((l, i) => <div key={i} style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 0", color: l.type === "error" ? "#e10600" : l.type === "success" ? "#00d26a" : "#8a8f98" }}><span style={{ color: "#555" }}>[{l.time}]</span> {l.msg}</div>)}</div>}
            {apiStatus.error && <div style={{ marginTop: 8, fontSize: 11, color: "#e10600", background: "#e1060015", padding: 8, borderRadius: 6 }}>{apiStatus.error}</div>}
          </div>
        )}

        {/* ═══ PREDICTOR ═══ */}
        {tab === "predict" && (
          <div className="fi">
            {!hasData ? (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🏎️</div><div style={{ fontSize: 14, fontWeight: 700, color: "#8a8f98", marginBottom: 6 }}>No FP data loaded yet</div><div style={{ fontSize: 12, color: "#555" }}>Click "Fetch FP Data" above to pull live practice results.</div></div>
            ) : (<>
              {/* SIGNAL CONTROLS */}
              <div style={{ ...S.card, border: "1px solid #a855f7", background: "#a855f708" }}>
                <div style={S.lbl("#a855f7")}>Signal Controls</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                  {ALL_SIGNALS.map(sig => {
                    const conf = signalConfig.find(s => s.key === sig.key);
                    return (
                      <div key={sig.key} style={{ background: conf.on ? "#1a1d24" : "#0d0f13", border: `1px solid ${conf.on ? sig.color + "66" : "#2d3139"}`, borderRadius: 8, padding: "10px 12px", opacity: conf.on ? 1 : 0.5, transition: "all 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: sig.color }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{sig.label}</span>
                          </div>
                          <div onClick={() => toggleSignal(sig.key)} style={{ width: 32, height: 18, borderRadius: 9, background: conf.on ? sig.color : "#2d3139", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: conf.on ? 16 : 2, transition: "all 0.2s" }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 9, color: "#555", marginBottom: 6 }}>{sig.desc}</div>
                        {conf.on && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="range" min={1} max={50} value={conf.weight} onChange={e => setSignalWeight(sig.key, parseInt(e.target.value))} style={{ flex: 1, accentColor: sig.color, cursor: "pointer" }} />
                            <span style={{ fontSize: 11, fontWeight: 900, color: sig.color, minWidth: 28, textAlign: "right" }}>{conf.weight}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SESSION WEIGHTS */}
              <div style={{ ...S.card, border: "1px solid #FF8000", background: "#FF800008" }}>
                <div style={S.lbl("#FF8000")}>Session Weights</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[{ k: "fp1", l: "FP1", c: "#8a8f98" }, { k: "fp2", l: "FP2", c: "#FF8000" }, { k: "fp3", l: "FP3", c: "#e10600" }].map(({ k, l, c }) => (
                    <div key={k} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: c, marginBottom: 4 }}>{l}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{sessionWeights[k]}%</div>
                      <input type="range" min={0} max={100} value={sessionWeights[k]} onChange={e => setSessionWeights(p => ({ ...p, [k]: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: c, cursor: "pointer" }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
                  {[["Equal", { fp1: 33, fp2: 33, fp3: 34 }], ["Recency", { fp1: 15, fp2: 35, fp3: 50 }], ["Early", { fp1: 50, fp2: 35, fp3: 15 }]].map(([n, w]) => (
                    <button key={n} onClick={() => setSessionWeights(w)} style={{ padding: "3px 8px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 4, color: "#8a8f98", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'Titillium Web', sans-serif" }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* RANKINGS TABLE */}
              <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 68px 46px 46px 52px", padding: "10px 12px", background: "#0d0f13", fontSize: 9, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 0.8, alignItems: "center" }}>
                  <span>#</span><span>Driver</span><span>Coeff</span><span style={{ textAlign: "center" }}>Q</span><span style={{ textAlign: "center" }}>R</span><span style={{ textAlign: "right" }}>Pts</span>
                </div>
                {rankedDrivers.filter(d => d.coeff > 0).map((d, i) => (
                  <div key={d.id} onClick={() => { setEditingDriver(d.id); }} style={{ display: "grid", gridTemplateColumns: "28px 1fr 68px 46px 46px 52px", padding: "8px 12px", borderTop: "1px solid #1a1d24", alignItems: "center", cursor: "pointer", background: i < 5 ? `${getTC(d.team)}08` : "transparent" }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: i < 5 ? "#fff" : "#555" }}>{i + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div style={{ width: 3, height: 20, borderRadius: 2, background: getTC(d.team), flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name.split(" ").pop()}</div><div style={{ fontSize: 9, color: "#8a8f98" }}>{getTeam(d.team).name} · ${d.price}M</div></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}><CoeffBar value={d.coeff} maxVal={maxCoeff} color={getTC(d.team)} /><span style={{ fontSize: 10, fontWeight: 800, color: "#c8ccd3", minWidth: 26, textAlign: "right" }}>{d.coeff.toFixed(2)}</span></div>
                    <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: d.pred.predictedQuali <= 10 ? "#00d26a" : "#8a8f98" }}>P{d.pred.predictedQuali}</div>
                    <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: d.pred.predictedRace <= 10 ? "#00d26a" : "#8a8f98" }}>P{d.pred.predictedRace}</div>
                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 900, color: d.projPts > 20 ? "#00d26a" : d.projPts > 5 ? "#FF8000" : "#8a8f98" }}>{d.projPts}</div>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {/* ═══ CHARTS ═══ */}
        {tab === "charts" && (
          <div className="fi">
            {!hasData ? (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div style={{ fontSize: 14, fontWeight: 700, color: "#8a8f98" }}>Fetch FP data first</div></div>
            ) : (<>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {[["radar", "Radar"], ["bar", "Bar Chart"], ["scatter", "Value Map"]].map(([k, l]) => (
                  <button key={k} onClick={() => setChartView(k)} style={{ padding: "8px 16px", background: chartView === k ? "#a855f7" : "#1a1d24", border: `1px solid ${chartView === k ? "#a855f7" : "#2d3139"}`, borderRadius: 6, color: chartView === k ? "#fff" : "#8a8f98", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Titillium Web', sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</button>
                ))}
              </div>

              {chartView === "radar" && (
                <div style={S.card}>
                  <div style={S.lbl("#a855f7")}>Driver Signal Comparison</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                    {rankedDrivers.filter(d => d.coeff > 0).slice(0, 12).map(d => (
                      <button key={d.id} onClick={() => toggleRadarDriver(d.id)} style={{ padding: "3px 8px", background: radarDrivers.includes(d.id) ? `${getTC(d.team)}33` : "#0d0f13", border: `1px solid ${radarDrivers.includes(d.id) ? getTC(d.team) : "#2d3139"}`, borderRadius: 4, color: radarDrivers.includes(d.id) ? "#fff" : "#555", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Titillium Web', sans-serif" }}>{d.name.split(" ").pop()}</button>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#2d3139" />
                      <PolarAngleAxis dataKey="signal" tick={{ fill: "#8a8f98", fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#555", fontSize: 9 }} />
                      {radarDrivers.map(did => {
                        const d = DRIVERS.find(x => x.id === did);
                        return d ? <Radar key={did} name={d.name.split(" ").pop()} dataKey={did} stroke={getTC(d.team)} fill={getTC(d.team)} fillOpacity={0.15} strokeWidth={2} /> : null;
                      })}
                      <RLegend wrapperStyle={{ fontSize: 10, color: "#8a8f98" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartView === "bar" && (
                <div style={S.card}>
                  <div style={S.lbl("#00d26a")}>Driver Coefficients (Top 15)</div>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 60, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" />
                      <XAxis type="number" tick={{ fill: "#8a8f98", fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "#c8ccd3", fontSize: 11, fontWeight: 700 }} width={55} />
                      <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff", fontWeight: 700 }} />
                      <Bar dataKey="coeff" name="Coefficient" radius={[0, 4, 4, 0]}>
                        {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartView === "scatter" && (
                <div style={S.card}>
                  <div style={S.lbl("#27F4D2")}>Value Map: Price vs Projected Points</div>
                  <div style={{ ...S.sub, marginBottom: 10 }}>Top-right = high points, high cost. Bottom-left = budget picks. Best value = high Y, low X.</div>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ bottom: 20, left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3139" />
                      <XAxis type="number" dataKey="x" name="Price ($M)" tick={{ fill: "#8a8f98", fontSize: 10 }} label={{ value: "Price ($M)", position: "bottom", fill: "#555", fontSize: 10 }} />
                      <YAxis type="number" dataKey="y" name="Proj Pts" tick={{ fill: "#8a8f98", fontSize: 10 }} label={{ value: "Proj Pts", angle: -90, position: "insideLeft", fill: "#555", fontSize: 10 }} />
                      <ZAxis type="number" dataKey="z" range={[40, 300]} />
                      <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [n === "x" ? `$${v}M` : v, n === "x" ? "Price" : n === "y" ? "Proj Pts" : "Coeff"]} />
                      <Scatter data={scatterData}>
                        {scatterData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        <LabelList dataKey="name" position="top" style={{ fill: "#c8ccd3", fontSize: 9, fontWeight: 700 }} />
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>)}
          </div>
        )}

        {/* ═══ OPTIMIZER ═══ */}
        {tab === "optimizer" && (
          <div className="fi">
            {!hasData ? <div style={{ ...S.card, textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div style={{ fontSize: 14, fontWeight: 700, color: "#8a8f98" }}>Fetch FP data first</div></div> : (<>
              <div style={{ ...S.sub, marginBottom: 14 }}>Top 5 lineups under $100M, ranked by projected boosted score.</div>
              {topLineups.map((lu, li) => { const best = li === 0; return (
                <div key={li} style={{ ...S.card, border: best ? "2px solid #00d26a" : "1px solid #2d3139", position: "relative", background: best ? "#00d26a08" : "#12141a" }}>
                  {best && <div style={{ position: "absolute", top: -1, right: 14, background: "#00d26a", color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 10px", borderRadius: "0 0 6px 6px", textTransform: "uppercase", letterSpacing: 1.5 }}>Best Pick</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: best ? "#00d26a" : "#8a8f98" }}>#{li + 1}</span>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 900, color: best ? "#00d26a" : "#FF8000", lineHeight: 1 }}>{lu.boostedPoints} pts</div><div style={{ fontSize: 9, color: "#555" }}>2x boost · ${lu.totalCost}M</div></div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Drivers ({lu.driverPts}pts)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {lu.drivers.map(d => { const isB = d.id === lu.boostDriver; return <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: isB ? `${getTC(d.team)}33` : `${getTC(d.team)}15`, border: `1px solid ${isB ? getTC(d.team) : "transparent"}`, borderRadius: 5, fontSize: 10, fontWeight: 700 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: getTC(d.team) }} />{d.name.split(" ").pop()} <span style={{ color: "#8a8f98", fontSize: 9 }}>${d.price}M</span> <span style={{ color: "#00d26a", fontSize: 9 }}>+{d.projPts}</span>{isB && <span style={{ fontSize: 8, background: "#e10600", color: "#fff", padding: "1px 3px", borderRadius: 3, fontWeight: 900 }}>2x</span>}</div>; })}
                    </div>
                  </div>
                  <div><div style={{ fontSize: 9, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Constructors ({lu.constructorPts}pts)</div><div style={{ display: "flex", gap: 4 }}>{lu.constructors.map(c => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: `${c.color}15`, borderRadius: 5, fontSize: 10, fontWeight: 700 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: c.color }} />{c.name} <span style={{ color: "#8a8f98", fontSize: 9 }}>${c.price}M</span></div>)}</div></div>
                  <div style={{ marginTop: 10 }}><div style={{ height: 4, background: "#0d0f13", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${(lu.totalCost / 100) * 100}%`, background: "linear-gradient(90deg, #00d26a, #00ff88)", borderRadius: 2 }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 9, color: "#555" }}><span>${lu.totalCost}M</span><span>${(100 - lu.totalCost).toFixed(1)}M free</span></div></div>
                </div>); })}
            </>)}
          </div>
        )}

        {/* ═══ TEAM ═══ */}
        {tab === "team" && (
          <div className="fi">
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1 }}>Budget</span><span style={{ fontSize: 14, fontWeight: 900, color: parseFloat(teamCost) > 100 ? "#e10600" : "#00d26a" }}>${teamCost}M / $100M</span></div>
              <div style={{ height: 8, background: "#1a1d24", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(100, (parseFloat(teamCost) / 100) * 100)}%`, background: parseFloat(teamCost) > 100 ? "#e10600" : "linear-gradient(90deg, #00d26a, #00ff88)", borderRadius: 4, transition: "width 0.3s" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#555" }}><span>${(100 - parseFloat(teamCost)).toFixed(1)}M remaining</span><span>{myDrivers.length}/5 · {myConstructors.length}/2</span></div>
            </div>
            <div style={S.lbl("#E8002D")}>Your Team</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {myDrivers.map(id => { const d = DRIVERS.find(x => x.id === id); return <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: `${getTC(d.team)}22`, border: `1px solid ${getTC(d.team)}`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}><div style={{ width: 3, height: 16, borderRadius: 2, background: getTC(d.team) }} />{d.name.split(" ").pop()} <span style={{ color: "#8a8f98", fontWeight: 400 }}>${d.price}M</span><button onClick={() => toggleDriver(id)} style={{ background: "none", border: "none", color: "#e10600", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button></div>; })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {myConstructors.map(id => { const t = TEAMS.find(x => x.id === id); return <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: `${t.color}22`, border: `1px solid ${t.color}`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}><div style={{ width: 3, height: 16, borderRadius: 2, background: t.color }} />{t.name} <span style={{ color: "#8a8f98", fontWeight: 400 }}>${t.price}M</span><button onClick={() => toggleConstructor(id)} style={{ background: "none", border: "none", color: "#e10600", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button></div>; })}
            </div>
            <input value={driverSearch} onChange={e => setDriverSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", padding: "10px 14px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 8, color: "#fff", fontSize: 13, fontFamily: "'Titillium Web', sans-serif", outline: "none", marginBottom: 12 }} />
            <div style={S.lbl()}>Drivers</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
              {filteredDrivers.map(d => <button key={d.id} onClick={() => toggleDriver(d.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: myDrivers.includes(d.id) ? `${getTC(d.team)}22` : "#12141a", border: `1.5px solid ${myDrivers.includes(d.id) ? getTC(d.team) : "#2d3139"}`, borderRadius: 8, cursor: "pointer", width: "100%" }}><div style={{ width: 4, height: 24, borderRadius: 2, background: getTC(d.team) }} /><div style={{ flex: 1, textAlign: "left" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{d.name}</div><div style={{ fontSize: 9, color: "#8a8f98", textTransform: "uppercase" }}>{getTeam(d.team).name}</div></div><div style={{ fontSize: 11, color: "#8a8f98", fontWeight: 700 }}>${d.price}M</div></button>)}
            </div>
            <div style={S.lbl()}>Constructors</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {TEAMS.map(t => <button key={t.id} onClick={() => toggleConstructor(t.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: myConstructors.includes(t.id) ? `${t.color}22` : "#12141a", border: `1.5px solid ${myConstructors.includes(t.id) ? t.color : "#2d3139"}`, borderRadius: 8, cursor: "pointer" }}><div style={{ width: 4, height: 24, borderRadius: 2, background: t.color }} /><div style={{ flex: 1, textAlign: "left" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t.name}</div><div style={{ fontSize: 9, color: "#8a8f98" }}>{t.engine}</div></div><div style={{ fontSize: 11, color: "#8a8f98", fontWeight: 700 }}>${t.price}M</div></button>)}
            </div>
          </div>
        )}

        {/* ═══ CALCULATOR ═══ */}
        {tab === "calculator" && (
          <div className="fi">
            <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1a1d24", border: `2px solid ${getTC(drv.team)}`, borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "'Titillium Web', sans-serif", fontWeight: 700, outline: "none", marginBottom: 12 }}>{DRIVERS.map(d => <option key={d.id} value={d.id}>#{d.num} {d.name}</option>)}</select>
            <div style={S.card}>
              <div style={S.lbl()}>Input</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}><NumInput label="Quali" value={driverInput.qualiPos} onChange={v => setDriverInput({ ...driverInput, qualiPos: v })} /><NumInput label="Race" value={driverInput.racePos} onChange={v => setDriverInput({ ...driverInput, racePos: v })} /><NumInput label="OT" value={driverInput.overtakes} onChange={v => setDriverInput({ ...driverInput, overtakes: v })} max={30} /></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}><Toggle value={driverInput.dnf} onChange={v => setDriverInput({ ...driverInput, dnf: v })} label="DNF" /><Toggle value={driverInput.fastestLap} onChange={v => setDriverInput({ ...driverInput, fastestLap: v })} label="FL" /><Toggle value={driverInput.dotd} onChange={v => setDriverInput({ ...driverInput, dotd: v })} label="DOTD" /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}><Toggle value={boost} onChange={v => { setBoost(v); if (v) setActiveChip(null); }} label="2x Boost" /><select value={activeChip || ""} onChange={e => { setActiveChip(e.target.value || null); if (e.target.value) setBoost(false); }} style={{ padding: "6px 10px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 6, color: "#fff", fontSize: 11, fontFamily: "'Titillium Web', sans-serif" }}><option value="">No Chip</option>{CHIPS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}><ScoreCard label="Base" value={ds.total} />{(boost || activeChip === "3xboost") && <ScoreCard label={boost ? "2x" : "3x"} value={boost ? ds.total * 2 : ds.total * 3} color="#FF8000" />}<ScoreCard label="Final" value={nn} color="#fff" sub={`PPM: ${(nn / drv.price).toFixed(2)}`} /></div>
            <div style={S.card}><div style={S.lbl()}>Breakdown</div>{ds.breakdown.map((b, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1a1d24", fontSize: 12 }}><span style={{ color: "#c8ccd3" }}>{b.l}</span><span style={{ color: b.p >= 0 ? "#00d26a" : "#e10600", fontWeight: 700 }}>{b.p > 0 ? "+" : ""}{b.p}</span></div>)}</div>
          </div>
        )}

        {/* ═══ RULES ═══ */}
        {tab === "rules" && (
          <div className="fi">
            {[{ t: "Qualifying", c: "#6692FF", d: QUALI_POINTS, e: "NC/DSQ: −5" }, { t: "Race", c: "#00d26a", d: RACE_POINTS, e: "DNF: −20 · Pos gained: +1 · Pos lost: −1 · OT: +1 · FL: +10 · DOTD: +10" }].map(sec => (
              <div key={sec.t} style={S.card}><div style={S.lbl(sec.c)}>{sec.t}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>{Object.entries(sec.d).map(([p, pts]) => <div key={p} style={{ textAlign: "center", padding: "5px 0", background: "#0d0f13", borderRadius: 5 }}><div style={{ fontSize: 9, color: "#8a8f98" }}>P{p}</div><div style={{ fontSize: 15, fontWeight: 900, color: sec.c }}>+{pts}</div></div>)}</div><div style={{ fontSize: 11, color: "#c8ccd3", lineHeight: 1.7 }}>{sec.e}</div></div>
            ))}
            <div style={S.card}><div style={S.lbl("#FF8000")}>Sprint</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>{Object.entries(SPRINT_POINTS).map(([p, pts]) => <div key={p} style={{ textAlign: "center", padding: "5px 0", background: "#0d0f13", borderRadius: 5 }}><div style={{ fontSize: 9, color: "#8a8f98" }}>P{p}</div><div style={{ fontSize: 15, fontWeight: 900, color: "#FF8000" }}>+{pts}</div></div>)}</div><div style={{ fontSize: 11, color: "#c8ccd3" }}>DNF: −10 · FL: +5 · +1/pos · +1/OT</div></div>
            <div style={S.card}><div style={S.lbl("#27F4D2")}>Constructor</div><div style={{ fontSize: 11, color: "#c8ccd3", lineHeight: 1.9 }}>Both Q3: +10 · Both Q2: +5 · One Q3: +3 · One Q2: +1 · Both Q1: −1<br />Race: sum of drivers · DSQ: −20/driver</div><div style={{ marginTop: 10, fontSize: 10, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", marginBottom: 5 }}>Pit Stops</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(75px, 1fr))", gap: 3 }}>{PIT_POINTS.map(p => <div key={p.label} style={{ textAlign: "center", padding: 4, background: "#0d0f13", borderRadius: 5 }}><div style={{ fontSize: 9, color: "#8a8f98" }}>{p.label}</div><div style={{ fontSize: 13, fontWeight: 900, color: p.pts > 0 ? "#27F4D2" : "#555" }}>+{p.pts}</div></div>)}</div></div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #1a1d24", padding: "12px 20px", textAlign: "center", marginTop: 24 }}><div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5 }}>F1 FANTASY PREDICTOR · 2026 · {enrichedSignals.filter(s => s.on).length} SIGNALS · OPENF1</div></div>
    </div>
  );
}
