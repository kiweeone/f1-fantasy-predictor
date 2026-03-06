import { useState, useMemo, useCallback } from "react";

// ─── 2026 F1 FANTASY SCORING RULES ───
const QUALI_POINTS = { 1:10, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1 };
const RACE_POINTS = { 1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1 };
const SPRINT_POINTS = { 1:8, 2:7, 3:6, 4:5, 5:4, 6:3, 7:2, 8:1 };
const PIT_POINTS = [
  { label: "<2.0s", min: 0, max: 1.99, pts: 10 }, { label: "2.0–2.19s", min: 2.0, max: 2.19, pts: 10 },
  { label: "2.2–2.49s", min: 2.2, max: 2.49, pts: 5 }, { label: "2.5–2.99s", min: 2.5, max: 2.99, pts: 2 },
  { label: "3.0s+", min: 3.0, max: 99, pts: 0 },
];
const DEFAULT_SESSION_WEIGHTS = { fp1: 33, fp2: 33, fp3: 34 }; // percentages, will be normalized
const SIGNAL_WEIGHTS = { paceDelta: 0.40, consistency: 0.25, longRunPace: 0.25, lapCount: 0.10 };

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

// ─── OPENF1 API INTEGRATION ───
const API = "https://api.openf1.org/v1";

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`API error: ${r.status}`);
  return r.json();
}

// Find session keys for latest meeting's practice sessions
async function fetchSessionKeys(year = 2026) {
  let sessions = [];

  // Try meeting_key=latest first
  try {
    sessions = await fetchJSON(`${API}/sessions?year=${year}&meeting_key=latest`);
  } catch (e) {
    // ignore, try fallback
  }

  // Fallback: get ALL sessions for the year and find the latest meeting
  if (!sessions || sessions.length === 0) {
    const all = await fetchJSON(`${API}/sessions?year=${year}`);
    if (all && all.length > 0) {
      const latestMeetingKey = all[all.length - 1].meeting_key;
      sessions = all.filter(s => s.meeting_key === latestMeetingKey);
    }
  }

  if (!sessions || sessions.length === 0) {
    throw new Error(`No sessions found for ${year}. The API may not have data yet.`);
  }

  const fp = {};

  // Strategy 1: Match by session_name (e.g. "Practice 1", "FP1")
  for (const s of sessions) {
    const name = (s.session_name || "").toLowerCase().trim();
    if (name === "practice 1" || name === "fp1" || name === "free practice 1") fp.fp1 = s.session_key;
    else if (name === "practice 2" || name === "fp2" || name === "free practice 2") fp.fp2 = s.session_key;
    else if (name === "practice 3" || name === "fp3" || name === "free practice 3") fp.fp3 = s.session_key;
  }

  // Strategy 2: If no named matches, find all "Practice" type sessions by order
  if (Object.keys(fp).length === 0) {
    const practiceSessions = sessions.filter(s =>
      (s.session_type || "").toLowerCase() === "practice"
    );
    if (practiceSessions.length >= 1) fp.fp1 = practiceSessions[0].session_key;
    if (practiceSessions.length >= 2) fp.fp2 = practiceSessions[1].session_key;
    if (practiceSessions.length >= 3) fp.fp3 = practiceSessions[2].session_key;
  }

  const meetingName = sessions[0]?.country_name || sessions[0]?.location || "Unknown GP";
  return { keys: fp, meetingName, rawSessions: sessions };
}

// Fetch all laps for a session, returns array of { driver_number, lap_duration, ... }
async function fetchLaps(sessionKey) {
  return fetchJSON(`${API}/laps?session_key=${sessionKey}`);
}

// Process raw laps into our 4 signals per driver
function processLaps(laps) {
  // Group by driver
  const byDriver = {};
  for (const lap of laps) {
    const dn = lap.driver_number;
    if (!byDriver[dn]) byDriver[dn] = [];
    if (lap.lap_duration && lap.lap_duration > 0) {
      byDriver[dn].push(lap.lap_duration);
    }
  }

  const result = {};
  for (const [dn, times] of Object.entries(byDriver)) {
    const driverId = numToId(parseInt(dn));
    if (!driverId || times.length === 0) continue;

    const sorted = [...times].sort((a, b) => a - b);
    const bestLap = sorted[0];
    const lapCount = times.length;

    // Consistency: std deviation of top 80% of laps (exclude outliers)
    const topN = Math.max(2, Math.ceil(times.length * 0.8));
    const topLaps = sorted.slice(0, topN);
    const mean = topLaps.reduce((a, b) => a + b, 0) / topLaps.length;
    const variance = topLaps.reduce((a, b) => a + (b - mean) ** 2, 0) / topLaps.length;
    const consistency = Math.sqrt(variance);

    // Long run pace: average of laps beyond the first 3 (simulating race runs)
    // If less than 5 laps total, use mean of all laps
    const longRunLaps = times.length > 5 ? sorted.slice(3) : sorted;
    const longRunPace = longRunLaps.reduce((a, b) => a + b, 0) / longRunLaps.length;

    result[driverId] = {
      bestLap: +bestLap.toFixed(3),
      consistency: +consistency.toFixed(3),
      longRunPace: +longRunPace.toFixed(3),
      lapCount,
    };
  }
  return result;
}

// ─── PREDICTION ENGINE ───
function computeCoefficients(fpData, sessionWeights) {
  const sessions = ["fp1", "fp2", "fp3"];
  const rawW = [sessionWeights.fp1, sessionWeights.fp2, sessionWeights.fp3];
  const driverIds = Object.keys(fpData);

  // Only include sessions that have grid-level data
  const activeSessions = sessions.filter(s => 
    driverIds.some(id => fpData[id]?.[s]?.bestLap > 0)
  );

  if (activeSessions.length === 0) return {};

  // Normalize user weights across active sessions only
  const activeRawW = activeSessions.map(ses => rawW[sessions.indexOf(ses)]);
  const totalRawW = activeRawW.reduce((a, b) => a + b, 0);
  const baseW = activeRawW.map(w => totalRawW > 0 ? w / totalRawW : 1 / activeSessions.length);

  // Find max lap count per session (for per-driver lap confidence scaling)
  const maxLapsPerSession = {};
  activeSessions.forEach(s => {
    const counts = driverIds.map(id => fpData[id]?.[s]?.lapCount || 0);
    maxLapsPerSession[s] = Math.max(...counts, 1);
  });

  const norms = activeSessions.map((s) => {
    const active = driverIds.filter(id => fpData[id]?.[s]?.bestLap > 0);
    const bests = active.map((id) => fpData[id][s].bestLap);
    const conss = active.map((id) => fpData[id][s].consistency);
    const longs = active.map((id) => fpData[id][s].longRunPace);
    const laps = active.map((id) => fpData[id][s].lapCount);
    return {
      bestMin: Math.min(...bests), bestMax: Math.max(...bests),
      consMin: Math.min(...conss), consMax: Math.max(...conss),
      longMin: Math.min(...longs), longMax: Math.max(...longs),
      lapMin: Math.min(...laps), lapMax: Math.max(...laps),
    };
  });

  const norm = (val, min, max, invert = false) => {
    if (max === min) return 0.5;
    const n = (val - min) / (max - min);
    return invert ? n : 1 - n;
  };

  const coefficients = {};
  driverIds.forEach((id) => {
    let composite = 0;
    let totalEffectiveWeight = 0;
    const sessionScores = [];

    activeSessions.forEach((s, si) => {
      const d = fpData[id]?.[s];
      if (!d || d.bestLap <= 0) {
        sessionScores.push({ session: s, pace: 0, cons: 0, longRun: 0, lapC: 0, score: 0, weight: 0, confidence: 0 });
        return;
      }
      const n = norms[si];
      const pace = norm(d.bestLap, n.bestMin, n.bestMax);
      const cons = norm(d.consistency, n.consMin, n.consMax);
      const longRun = norm(d.longRunPace, n.longMin, n.longMax);
      const lapC = norm(d.lapCount, n.lapMin, n.lapMax, true);
      const score = pace * SIGNAL_WEIGHTS.paceDelta + cons * SIGNAL_WEIGHTS.consistency + longRun * SIGNAL_WEIGHTS.longRunPace + lapC * SIGNAL_WEIGHTS.lapCount;

      // Per-driver confidence: scale session weight by how many laps they did vs max
      // A driver with 3 laps in a session where others did 30 gets reduced influence
      const confidence = Math.min(1, (d.lapCount / maxLapsPerSession[s]) * 1.5);
      // Blend: 70% user-set weight + 30% lap-confidence adjustment
      const effectiveWeight = baseW[si] * (0.7 + 0.3 * confidence);

      sessionScores.push({ session: s, pace, cons, longRun, lapC, score, weight: effectiveWeight, confidence: +confidence.toFixed(2) });
      composite += score * effectiveWeight;
      totalEffectiveWeight += effectiveWeight;
    });

    // Normalize composite by total effective weight (so drivers with missing sessions are comparable)
    if (totalEffectiveWeight > 0) composite /= totalEffectiveWeight;

    coefficients[id] = { composite: +composite.toFixed(4), sessions: sessionScores };
  });
  return coefficients;
}

function predictPositions(coefficients) {
  const entries = Object.entries(coefficients).filter(([, v]) => v.composite > 0);
  const sorted = entries.sort((a, b) => b[1].composite - a[1].composite).map(([id], i) => ({ id, predictedQuali: i + 1, predictedRace: i + 1 }));
  // Slight race variance for midfield
  const rng = ((s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(777);
  sorted.forEach((d, i) => {
    if (i > 2 && i < sorted.length - 3) d.predictedRace = Math.max(1, Math.min(sorted.length, d.predictedRace + Math.round((rng() - 0.45) * 2)));
  });
  const raceSorted = [...sorted].sort((a, b) => a.predictedRace - b.predictedRace);
  raceSorted.forEach((d, i) => { d.predictedRace = i + 1; });
  // Drivers with no data get position = grid end
  const map = {};
  DRIVERS.forEach(d => { map[d.id] = { id: d.id, predictedQuali: 22, predictedRace: 22 }; });
  sorted.forEach((d) => { map[d.id] = d; });
  return map;
}

function projectFantasyPoints(driverId, qP, rP) {
  let pts = 0;
  pts += QUALI_POINTS[qP] || 0;
  pts += RACE_POINTS[rP] || 0;
  const gained = qP - rP;
  pts += gained;
  pts += Math.max(0, gained); // est overtakes
  if (rP <= 3) pts += 1;
  return pts;
}

function projectConstructorPoints(team, preds) {
  const tds = DRIVERS.filter((d) => d.team === team.id);
  let pts = 0;
  const qPs = tds.map((d) => preds[d.id]?.predictedQuali || 22);
  const rPs = tds.map((d) => preds[d.id]?.predictedRace || 22);
  const inQ3 = qPs.filter((p) => p <= 10).length;
  const inQ2 = qPs.filter((p) => p <= 15).length;
  if (inQ3 >= 2) pts += 10; else if (inQ2 >= 2) pts += 5; else if (inQ3 >= 1) pts += 3; else if (inQ2 >= 1) pts += 1; else pts -= 1;
  rPs.forEach((p) => { pts += RACE_POINTS[p] || 0; });
  const tr = TEAMS.findIndex((t) => t.id === team.id);
  pts += tr <= 3 ? 8 : tr <= 6 ? 4 : 1;
  return pts;
}

// ─── LINEUP OPTIMIZER ───
function optimizeLineups(preds, coeffs, topN = 5) {
  const ds = {};
  DRIVERS.forEach((d) => {
    const p = preds[d.id]; if (!p) return;
    const pts = projectFantasyPoints(d.id, p.predictedQuali, p.predictedRace);
    ds[d.id] = { pts, ppm: pts / d.price };
  });
  const cs = {};
  TEAMS.forEach((t) => { const pts = projectConstructorPoints(t, preds); cs[t.id] = { pts, ppm: pts / t.price }; });

  const sD = DRIVERS.map((d) => ({ ...d, projPts: ds[d.id]?.pts || 0, projPPM: ds[d.id]?.ppm || 0 })).sort((a, b) => b.projPPM - a.projPPM);
  const sC = TEAMS.map((t) => ({ ...t, projPts: cs[t.id]?.pts || 0, projPPM: cs[t.id]?.ppm || 0 })).sort((a, b) => b.projPPM - a.projPPM);

  const cPairs = [];
  for (let i = 0; i < sC.length; i++) for (let j = i + 1; j < sC.length; j++) cPairs.push([sC[i], sC[j]]);
  cPairs.sort((a, b) => (b[0].projPts + b[1].projPts) - (a[0].projPts + a[1].projPts));

  const lineups = [];
  cPairs.slice(0, 20).forEach(([c1, c2]) => {
    const cCost = c1.price + c2.price, cPts = c1.projPts + c2.projPts, bl = 100 - cCost;
    const picked = []; let spent = 0; const avail = [...sD];
    for (let r = 0; r < 5; r++) {
      let bi = -1, bs = -Infinity;
      for (let i = 0; i < avail.length; i++) {
        const d = avail[i]; if (spent + d.price > bl) continue;
        if ((4 - r) > 0 && spent + d.price + (4 - r) * 5 > bl) continue;
        const sc = d.projPts * 0.6 + d.projPPM * 20 * 0.4;
        if (sc > bs) { bs = sc; bi = i; }
      }
      if (bi >= 0) { picked.push(avail[bi]); spent += avail[bi].price; avail.splice(bi, 1); }
    }
    if (picked.length === 5) {
      const dPts = picked.reduce((s, d) => s + d.projPts, 0);
      const total = dPts + cPts, tc = +(spent + cCost).toFixed(1);
      const bd = picked.reduce((b, d) => d.projPts > b.projPts ? d : b, picked[0]);
      lineups.push({ drivers: picked, constructors: [c1, c2], totalCost: tc, projPoints: +total.toFixed(1), boostedPoints: +(total + bd.projPts).toFixed(1), boostDriver: bd.id, driverPts: +dPts.toFixed(1), constructorPts: +cPts.toFixed(1) });
    }
  });
  const seen = new Set();
  return lineups.filter((l) => { const k = [...l.drivers.map((d) => d.id).sort(), ...l.constructors.map((c) => c.id).sort()].join(","); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => b.boostedPoints - a.boostedPoints).slice(0, topN);
}

// ─── MANUAL CALC ───
function calcDriverScore(inp) {
  let t = 0, bd = [];
  const qP = QUALI_POINTS[inp.qualiPos] || 0;
  if (inp.qualiPos === 0) { bd.push({ l: "Quali NC/DSQ", p: -5 }); t -= 5; }
  else if (qP) { bd.push({ l: `Quali P${inp.qualiPos}`, p: qP }); t += qP; }
  if (inp.dnf) { bd.push({ l: "DNF/DSQ", p: -20 }); t -= 20; }
  else {
    const rP = RACE_POINTS[inp.racePos] || 0;
    if (rP) { bd.push({ l: `Race P${inp.racePos}`, p: rP }); t += rP; }
    if (inp.qualiPos > 0 && inp.racePos > 0) { const g = inp.qualiPos - inp.racePos; if (g !== 0) { bd.push({ l: `${g > 0 ? "+" : ""}${g} pos`, p: g }); t += g; } }
    if (inp.overtakes > 0) { bd.push({ l: `${inp.overtakes} overtakes`, p: inp.overtakes }); t += inp.overtakes; }
  }
  if (inp.fastestLap) { bd.push({ l: "Fastest Lap", p: 10 }); t += 10; }
  if (inp.dotd) { bd.push({ l: "DOTD", p: 10 }); t += 10; }
  if (inp.sprintPos > 0) { const sP = SPRINT_POINTS[inp.sprintPos] || 0; if (sP) { bd.push({ l: `Sprint P${inp.sprintPos}`, p: sP }); t += sP; } if (inp.sprintQualiPos > 0) { const sG = inp.sprintQualiPos - inp.sprintPos; if (sG !== 0) { bd.push({ l: `Sprint ${sG > 0 ? "+" : ""}${sG}`, p: sG }); t += sG; } } if (inp.sprintOvertakes > 0) { bd.push({ l: `Sprint ${inp.sprintOvertakes} OT`, p: inp.sprintOvertakes }); t += inp.sprintOvertakes; } if (inp.sprintFastestLap) { bd.push({ l: "Sprint FL", p: 5 }); t += 5; } }
  if (inp.sprintDnf) { bd.push({ l: "Sprint DNF", p: -10 }); t -= 10; }
  return { total: t, breakdown: bd };
}

// ─── UI COMPONENTS ───
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

  // Session weight controls (user-adjustable, percentages)
  const [sessionWeights, setSessionWeights] = useState({ ...DEFAULT_SESSION_WEIGHTS });

  // Team Builder state
  const [myDrivers, setMyDrivers] = useState(["VER", "BEA", "GAS", "LIN", "BOT"]);
  const [myConstructors, setMyConstructors] = useState(["ferrari", "racingbulls"]);
  const [driverSearch, setDriverSearch] = useState("");

  // API state
  const [apiStatus, setApiStatus] = useState({ loading: false, error: null, meetingName: null, fetched: {} });
  const [fetchLog, setFetchLog] = useState([]);

  const addLog = (msg, type = "info") => setFetchLog(prev => [...prev.slice(-15), { msg, type, time: new Date().toLocaleTimeString() }]);

  // ─── FETCH FP DATA FROM OPENF1 ───
  const fetchFPData = useCallback(async () => {
    setApiStatus(prev => ({ ...prev, loading: true, error: null }));
    addLog("Connecting to OpenF1 API...", "info");

    try {
      // Step 1: Get session keys
      addLog("Fetching session keys for latest meeting...");
      const { keys, meetingName, rawSessions } = await fetchSessionKeys(2026);
      addLog(`Found meeting: ${meetingName}`, "success");
      
      // Debug: log what sessions the API returned
      if (rawSessions?.length > 0) {
        rawSessions.forEach(s => {
          addLog(`  → session_name: "${s.session_name}", session_type: "${s.session_type}", key: ${s.session_key}`, "info");
        });
      }
      
      addLog(`Matched FP sessions: ${Object.keys(keys).map(k => k.toUpperCase()).join(", ") || "none"}`, Object.keys(keys).length > 0 ? "success" : "error");

      if (Object.keys(keys).length === 0) {
        throw new Error("No practice sessions found for the latest meeting. Sessions may not have started yet.");
      }

      const newFpData = {};
      DRIVERS.forEach(d => { newFpData[d.id] = { fp1: { bestLap: 0, consistency: 0, longRunPace: 0, lapCount: 0 }, fp2: { bestLap: 0, consistency: 0, longRunPace: 0, lapCount: 0 }, fp3: { bestLap: 0, consistency: 0, longRunPace: 0, lapCount: 0 } }; });

      const fetched = {};

      // Step 2: Fetch laps for each available session
      for (const [session, sessionKey] of Object.entries(keys)) {
        addLog(`Fetching ${session.toUpperCase()} laps (key: ${sessionKey})...`);
        try {
          const laps = await fetchLaps(sessionKey);
          addLog(`${session.toUpperCase()}: ${laps.length} lap records received`, "success");

          const processed = processLaps(laps);
          const driverCount = Object.keys(processed).length;
          addLog(`${session.toUpperCase()}: Processed data for ${driverCount} drivers`, "success");

          // Merge into fpData
          for (const [driverId, signals] of Object.entries(processed)) {
            if (newFpData[driverId]) {
              newFpData[driverId][session] = signals;
            }
          }
          fetched[session] = true;
        } catch (err) {
          addLog(`${session.toUpperCase()}: ${err.message}`, "error");
        }
      }

      setFpData(newFpData);
      setApiStatus({ loading: false, error: null, meetingName, fetched });
      addLog("Data fetch complete. Predictions updated.", "success");

    } catch (err) {
      setApiStatus(prev => ({ ...prev, loading: false, error: err.message }));
      addLog(`Error: ${err.message}`, "error");
    }
  }, []);

  // Computed predictions
  const coefficients = useMemo(() => computeCoefficients(fpData, sessionWeights), [fpData, sessionWeights]);
  const predictions = useMemo(() => predictPositions(coefficients), [coefficients]);
  const topLineups = useMemo(() => optimizeLineups(predictions, coefficients, 5), [predictions, coefficients]);
  const maxCoeff = useMemo(() => { const vals = Object.values(coefficients).map((c) => c.composite); return vals.length ? Math.max(...vals) : 1; }, [coefficients]);
  const hasData = Object.keys(coefficients).length > 0;

  const rankedDrivers = useMemo(() => {
    return DRIVERS.map((d) => ({
      ...d, coeff: coefficients[d.id]?.composite || 0,
      pred: predictions[d.id] || { predictedQuali: 22, predictedRace: 22 },
      projPts: projectFantasyPoints(d.id, predictions[d.id]?.predictedQuali || 22, predictions[d.id]?.predictedRace || 22),
    })).sort((a, b) => b.coeff - a.coeff);
  }, [coefficients, predictions]);

  const updateFP = (dId, ses, field, val) => setFpData(prev => ({ ...prev, [dId]: { ...prev[dId], [ses]: { ...(prev[dId]?.[ses] || {}), [field]: val } } }));

  // Team builder
  const teamCost = useMemo(() => {
    const dC = myDrivers.reduce((s, id) => s + (DRIVERS.find(d => d.id === id)?.price || 0), 0);
    const cC = myConstructors.reduce((s, id) => s + (TEAMS.find(t => t.id === id)?.price || 0), 0);
    return (dC + cC).toFixed(1);
  }, [myDrivers, myConstructors]);
  const toggleDriver = (id) => { if (myDrivers.includes(id)) setMyDrivers(myDrivers.filter(d => d !== id)); else if (myDrivers.length < 5) setMyDrivers([...myDrivers, id]); };
  const toggleConstructor = (id) => { if (myConstructors.includes(id)) setMyConstructors(myConstructors.filter(c => c !== id)); else if (myConstructors.length < 2) setMyConstructors([...myConstructors, id]); };
  const filteredDrivers = DRIVERS.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()) || getTeam(d.team)?.name.toLowerCase().includes(driverSearch.toLowerCase()));

  const drv = DRIVERS.find((d) => d.id === selectedDriver);
  const ds = calcDriverScore(driverInput);
  const fs = boost ? ds.total * 2 : activeChip === "3xboost" ? ds.total * 3 : ds.total;
  const nn = activeChip === "noneg" ? Math.max(0, fs) : fs;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f13", color: "#fff", fontFamily: "'Titillium Web', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#12141a}::-webkit-scrollbar-thumb{background:#2d3139;border-radius:3px}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fadeIn 0.25s ease-out}select{appearance:none}@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #e10600 0%, #7a0200 100%)", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -10, width: 160, height: 160, border: "30px solid rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>F1</span><span style={{ fontSize: 13, fontWeight: 300, opacity: 0.85, letterSpacing: 2, textTransform: "uppercase" }}>Fantasy Predictor</span></div>
          <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 600, letterSpacing: 1.5, marginTop: 2 }}>2026 · OPENF1 LIVE DATA · FP ANALYSIS · LINEUP OPTIMIZER{apiStatus.meetingName ? ` · ${apiStatus.meetingName.toUpperCase()}` : ""}</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: "#12141a", borderBottom: "1px solid #2d3139", overflowX: "auto", padding: "0 4px" }}>
        <Tab active={tab === "predict"} onClick={() => setTab("predict")} color="#FF8000">Predictor</Tab>
        <Tab active={tab === "fpinput"} onClick={() => setTab("fpinput")} color="#a855f7">FP Data</Tab>
        <Tab active={tab === "optimizer"} onClick={() => setTab("optimizer")} color="#00d26a">Optimizer</Tab>
        <Tab active={tab === "team"} onClick={() => setTab("team")} color="#E8002D">Team</Tab>
        <Tab active={tab === "calculator"} onClick={() => setTab("calculator")}>Score Calc</Tab>
        <Tab active={tab === "rules"} onClick={() => setTab("rules")} color="#6692FF">Rules</Tab>
        <Tab active={tab === "chips"} onClick={() => setTab("chips")} color="#27F4D2">Chips</Tab>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "20px 14px" }}>

        {/* ═══ FETCH BUTTON (shown on Predictor & FP Data) ═══ */}
        {(tab === "predict" || tab === "fpinput") && (
          <div style={{ ...S.card, background: "linear-gradient(135deg, #1a1d24 0%, #12141a 100%)", border: "1px solid #3671C6", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: fetchLog.length > 0 ? 12 : 0 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#3671C6", textTransform: "uppercase", letterSpacing: 1 }}>OpenF1 Live Data</div>
                <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                  {apiStatus.meetingName ? `${apiStatus.meetingName} · Sessions: ${Object.keys(apiStatus.fetched).map(s => s.toUpperCase()).join(", ") || "none"}` : "Fetch practice session data from api.openf1.org"}
                </div>
              </div>
              <button onClick={fetchFPData} disabled={apiStatus.loading} style={{ padding: "10px 20px", background: apiStatus.loading ? "#2d3139" : "#3671C6", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: apiStatus.loading ? "default" : "pointer", fontFamily: "'Titillium Web', sans-serif", textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {apiStatus.loading && <span className="spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />}
                {apiStatus.loading ? "Fetching..." : hasData ? "Refresh Data" : "Fetch FP Data"}
              </button>
            </div>

            {/* Fetch log */}
            {fetchLog.length > 0 && (
              <div style={{ maxHeight: 140, overflowY: "auto", background: "#0d0f13", borderRadius: 6, padding: 8 }}>
                {fetchLog.map((log, i) => (
                  <div key={i} style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 0", color: log.type === "error" ? "#e10600" : log.type === "success" ? "#00d26a" : "#8a8f98" }}>
                    <span style={{ color: "#555" }}>[{log.time}]</span> {log.msg}
                  </div>
                ))}
              </div>
            )}

            {apiStatus.error && <div style={{ marginTop: 8, fontSize: 11, color: "#e10600", background: "#e1060015", padding: 8, borderRadius: 6 }}>{apiStatus.error}</div>}
          </div>
        )}

        {/* ═══ PREDICTOR ═══ */}
        {tab === "predict" && (
          <div className="fi">
            {!hasData ? (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏎️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#8a8f98", marginBottom: 6 }}>No FP data loaded yet</div>
                <div style={{ fontSize: 12, color: "#555" }}>Click "Fetch FP Data" above to pull live practice session results from OpenF1, or enter data manually in the FP Data tab.</div>
              </div>
            ) : (
              <>
                <div style={{ ...S.sub, marginBottom: 14 }}>
                  Coefficients from {Object.keys(apiStatus.fetched).map(s => s.toUpperCase()).join(" + ") || "manual data"}. Adjust session weights below. Per-driver confidence scales automatically by lap count — low-lap sessions carry less influence.
                </div>

                {/* SESSION WEIGHT SLIDERS */}
                <div style={{ ...S.card, border: "1px solid #FF8000", background: "#FF800008" }}>
                  <div style={S.lbl("#FF8000")}>Session Weights</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {[
                      { key: "fp1", label: "FP1", color: "#8a8f98" },
                      { key: "fp2", label: "FP2", color: "#FF8000" },
                      { key: "fp3", label: "FP3", color: "#e10600" },
                    ].map(({ key, label, color }) => (
                      <div key={key} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{sessionWeights[key]}%</div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={sessionWeights[key]}
                          onChange={(e) => setSessionWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                          style={{ width: "100%", accentColor: color, cursor: "pointer" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ fontSize: 10, color: "#555" }}>
                      Total: {sessionWeights.fp1 + sessionWeights.fp2 + sessionWeights.fp3}% (auto-normalized)
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setSessionWeights({ fp1: 33, fp2: 33, fp3: 34 })} style={{ padding: "4px 10px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 4, color: "#8a8f98", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Titillium Web', sans-serif" }}>Equal</button>
                      <button onClick={() => setSessionWeights({ fp1: 15, fp2: 35, fp3: 50 })} style={{ padding: "4px 10px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 4, color: "#8a8f98", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Titillium Web', sans-serif" }}>Recency</button>
                      <button onClick={() => setSessionWeights({ fp1: 50, fp2: 35, fp3: 15 })} style={{ padding: "4px 10px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 4, color: "#8a8f98", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Titillium Web', sans-serif" }}>Early</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  {[{ l: "Pace 40%", c: "#e10600" }, { l: "Consistency 25%", c: "#FF8000" }, { l: "Long Run 25%", c: "#a855f7" }, { l: "Laps 10%", c: "#6692FF" }].map(s => <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#8a8f98" }}><div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />{s.l}</div>)}
                </div>

                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 68px 46px 46px 52px", padding: "10px 12px", background: "#0d0f13", fontSize: 9, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 0.8, alignItems: "center" }}>
                    <span>#</span><span>Driver</span><span>Coeff</span><span style={{ textAlign: "center" }}>Q</span><span style={{ textAlign: "center" }}>R</span><span style={{ textAlign: "right" }}>Pts</span>
                  </div>
                  {rankedDrivers.filter(d => d.coeff > 0).map((d, i) => (
                    <div key={d.id} onClick={() => { setEditingDriver(d.id); setTab("fpinput"); }} style={{ display: "grid", gridTemplateColumns: "28px 1fr 68px 46px 46px 52px", padding: "8px 12px", borderTop: "1px solid #1a1d24", alignItems: "center", cursor: "pointer", background: i < 5 ? `${getTC(d.team)}08` : "transparent" }}>
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

                {/* Session breakdown */}
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.lbl("#FF8000")}>Session Breakdown</div>
                    <select value={editingDriver} onChange={(e) => setEditingDriver(e.target.value)} style={{ padding: "5px 8px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 6, color: "#fff", fontSize: 11, fontFamily: "'Titillium Web', sans-serif" }}>
                      {DRIVERS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  {coefficients[editingDriver]?.sessions?.map((s, i) => (
                    <div key={s.session} style={{ marginBottom: i < (coefficients[editingDriver].sessions.length - 1) ? 10 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#c8ccd3", textTransform: "uppercase" }}>
                          {s.session.toUpperCase()}
                          {s.score > 0 && s.confidence != null && <span style={{ color: s.confidence >= 0.8 ? "#00d26a" : s.confidence >= 0.4 ? "#FF8000" : "#e10600", fontWeight: 400, marginLeft: 6 }}>
                            conf: {Math.round(s.confidence * 100)}%
                          </span>}
                          {s.score <= 0 && <span style={{ color: "#555", fontWeight: 400 }}> (no data)</span>}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "#FF8000" }}>{s.score.toFixed(3)}</span>
                      </div>
                      {s.score > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                        {[{ l: "Pace", v: s.pace, c: "#e10600" }, { l: "Consist", v: s.cons, c: "#FF8000" }, { l: "Long Run", v: s.longRun, c: "#a855f7" }, { l: "Laps", v: s.lapC, c: "#6692FF" }].map(sig => (
                          <div key={sig.l} style={{ background: "#0d0f13", borderRadius: 5, padding: "5px 6px", textAlign: "center" }}>
                            <div style={{ fontSize: 8, color: "#555", marginBottom: 1 }}>{sig.l}</div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: sig.c }}>{(sig.v * 100).toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>}
                    </div>
                  )) || <div style={{ color: "#555", fontSize: 12 }}>No data for this driver</div>}
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ FP DATA ═══ */}
        {tab === "fpinput" && (
          <div className="fi">
            <div style={{ ...S.sub, marginBottom: 14 }}>Edit practice data per driver. Use "Fetch FP Data" above to auto-populate from OpenF1, or enter manually. Best lap (s), std deviation (consistency), long run pace (s), lap count.</div>
            <div style={{ marginBottom: 14 }}>
              <select value={editingDriver} onChange={(e) => setEditingDriver(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1a1d24", border: `2px solid ${getTC(DRIVERS.find(d => d.id === editingDriver)?.team)}`, borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "'Titillium Web', sans-serif", fontWeight: 700, outline: "none" }}>
                {DRIVERS.map(d => <option key={d.id} value={d.id}>#{d.num} {d.name} — {getTeam(d.team).name}</option>)}
              </select>
            </div>
            {["fp1", "fp2", "fp3"].map((ses, si) => {
              const colors = ["#8a8f98", "#FF8000", "#e10600"];
              const hasSessionData = fpData[editingDriver]?.[ses]?.bestLap > 0;
              return (
                <div key={ses} style={{ ...S.card, borderLeft: `3px solid ${colors[si]}`, opacity: hasSessionData ? 1 : 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: colors[si], textTransform: "uppercase", letterSpacing: 1 }}>{ses.toUpperCase()} {hasSessionData ? "✓" : ""}</span>
                    <span style={{ fontSize: 10, color: "#555", fontWeight: 600 }}>Weight: {[15, 35, 50][si]}%</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    <NumInput label="Best Lap (s)" value={fpData[editingDriver]?.[ses]?.bestLap || 0} onChange={(v) => updateFP(editingDriver, ses, "bestLap", +v.toFixed(3))} min={0} max={150} />
                    <NumInput label="Std Dev (s)" value={fpData[editingDriver]?.[ses]?.consistency || 0} onChange={(v) => updateFP(editingDriver, ses, "consistency", +v.toFixed(3))} min={0} max={5} />
                    <NumInput label="Long Run Pace (s)" value={fpData[editingDriver]?.[ses]?.longRunPace || 0} onChange={(v) => updateFP(editingDriver, ses, "longRunPace", +v.toFixed(3))} min={0} max={150} />
                    <NumInput label="Lap Count" value={fpData[editingDriver]?.[ses]?.lapCount || 0} onChange={(v) => updateFP(editingDriver, ses, "lapCount", Math.round(v))} min={0} max={60} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ OPTIMIZER ═══ */}
        {tab === "optimizer" && (
          <div className="fi">
            {!hasData ? (
              <div style={{ ...S.card, textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div style={{ fontSize: 14, fontWeight: 700, color: "#8a8f98" }}>Fetch FP data first</div><div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Go to the Predictor tab and click "Fetch FP Data" to load practice session results.</div></div>
            ) : (
              <>
                <div style={{ ...S.sub, marginBottom: 14 }}>Top 5 optimal lineups (5 drivers + 2 constructors, $100M cap) ranked by projected boosted score based on FP performance coefficients.</div>
                {topLineups.map((lu, li) => {
                  const best = li === 0;
                  return (
                    <div key={li} style={{ ...S.card, border: best ? "2px solid #00d26a" : "1px solid #2d3139", position: "relative", background: best ? "#00d26a08" : "#12141a" }}>
                      {best && <div style={{ position: "absolute", top: -1, right: 14, background: "#00d26a", color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 10px", borderRadius: "0 0 6px 6px", textTransform: "uppercase", letterSpacing: 1.5 }}>Best Pick</div>}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: best ? "#00d26a" : "#8a8f98" }}>#{li + 1}</span>
                        <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 900, color: best ? "#00d26a" : "#FF8000", lineHeight: 1 }}>{lu.boostedPoints} pts</div><div style={{ fontSize: 9, color: "#555" }}>with 2x boost · ${lu.totalCost}M</div></div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Drivers ({lu.driverPts} pts)</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {lu.drivers.map(d => { const isB = d.id === lu.boostDriver; return (
                            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: isB ? `${getTC(d.team)}33` : `${getTC(d.team)}15`, border: `1px solid ${isB ? getTC(d.team) : "transparent"}`, borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                              <div style={{ width: 3, height: 14, borderRadius: 2, background: getTC(d.team) }} />{d.name.split(" ").pop()}<span style={{ color: "#8a8f98", fontWeight: 400, fontSize: 9 }}>${d.price}M</span><span style={{ color: "#00d26a", fontSize: 9 }}>+{d.projPts}</span>
                              {isB && <span style={{ fontSize: 8, background: "#e10600", color: "#fff", padding: "1px 3px", borderRadius: 3, fontWeight: 900 }}>2x</span>}
                            </div>);
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Constructors ({lu.constructorPts} pts)</div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {lu.constructors.map(c => <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: `${c.color}15`, borderRadius: 5, fontSize: 10, fontWeight: 700 }}><div style={{ width: 3, height: 14, borderRadius: 2, background: c.color }} />{c.name}<span style={{ color: "#8a8f98", fontWeight: 400, fontSize: 9 }}>${c.price}M</span><span style={{ color: "#00d26a", fontSize: 9 }}>+{c.projPts}</span></div>)}
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ height: 4, background: "#0d0f13", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${(lu.totalCost / 100) * 100}%`, background: "linear-gradient(90deg, #00d26a, #00ff88)", borderRadius: 2 }} /></div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 9, color: "#555" }}><span>${lu.totalCost}M / $100M</span><span>Headroom: ${(100 - lu.totalCost).toFixed(1)}M</span></div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ═══ TEAM BUILDER ═══ */}
        {tab === "team" && (
          <div className="fi">
            {/* Budget bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", letterSpacing: 1 }}>Budget</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: parseFloat(teamCost) > 100 ? "#e10600" : "#00d26a" }}>${teamCost}M / $100M</span>
              </div>
              <div style={{ height: 8, background: "#1a1d24", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, (parseFloat(teamCost) / 100) * 100)}%`, background: parseFloat(teamCost) > 100 ? "linear-gradient(90deg, #e10600, #ff4444)" : "linear-gradient(90deg, #00d26a, #00ff88)", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#555" }}>
                <span>Remaining: ${(100 - parseFloat(teamCost)).toFixed(1)}M</span>
                <span>{myDrivers.length}/5 Drivers · {myConstructors.length}/2 Constructors</span>
              </div>
            </div>

            {/* Selected team */}
            <div style={{ marginBottom: 20 }}>
              <div style={S.lbl("#E8002D")}>Your Team</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {myDrivers.map((id) => { const d = DRIVERS.find(dr => dr.id === id); return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: `${getTC(d.team)}22`, border: `1px solid ${getTC(d.team)}`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: getTC(d.team) }} />
                    {d.name.split(" ").pop()}
                    <span style={{ color: "#8a8f98", fontWeight: 400 }}>${d.price}M</span>
                    {hasData && coefficients[d.id] && <span style={{ color: "#FF8000", fontSize: 10 }}>⚡{coefficients[d.id].composite.toFixed(2)}</span>}
                    <button onClick={() => toggleDriver(id)} style={{ background: "none", border: "none", color: "#e10600", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ); })}
                {myDrivers.length === 0 && <span style={{ fontSize: 12, color: "#555" }}>No drivers selected</span>}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {myConstructors.map((id) => { const t = TEAMS.find(tm => tm.id === id); return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: `${t.color}22`, border: `1px solid ${t.color}`, borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 2, background: t.color }} />
                    {t.name}
                    <span style={{ color: "#8a8f98", fontWeight: 400 }}>${t.price}M</span>
                    <button onClick={() => toggleConstructor(id)} style={{ background: "none", border: "none", color: "#e10600", cursor: "pointer", fontSize: 14, fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ); })}
                {myConstructors.length === 0 && <span style={{ fontSize: 12, color: "#555" }}>No constructors selected</span>}
              </div>
            </div>

            {/* Projected team score */}
            {hasData && myDrivers.length === 5 && myConstructors.length === 2 && (
              <div style={{ ...S.card, background: "linear-gradient(135deg, #E8002D11, #12141a)", border: "1px solid #E8002D44" }}>
                <div style={S.lbl("#E8002D")}>Projected Team Score</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <ScoreCard label="Drivers" value={myDrivers.reduce((s, id) => s + projectFantasyPoints(id, predictions[id]?.predictedQuali || 22, predictions[id]?.predictedRace || 22), 0)} />
                  <ScoreCard label="Constructors" value={myConstructors.reduce((s, id) => s + projectConstructorPoints(TEAMS.find(t => t.id === id), predictions), 0)} color="#27F4D2" />
                  <ScoreCard label="Total" value={myDrivers.reduce((s, id) => s + projectFantasyPoints(id, predictions[id]?.predictedQuali || 22, predictions[id]?.predictedRace || 22), 0) + myConstructors.reduce((s, id) => s + projectConstructorPoints(TEAMS.find(t => t.id === id), predictions), 0)} color="#fff" />
                </div>
              </div>
            )}

            {/* Driver search + list */}
            <div style={{ marginBottom: 12 }}>
              <input value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} placeholder="Search drivers or teams..." style={{ width: "100%", padding: "10px 14px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 8, color: "#fff", fontSize: 13, fontFamily: "'Titillium Web', sans-serif", outline: "none" }} />
            </div>
            <div style={S.lbl()}>Drivers</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
              {filteredDrivers.map(d => (
                <button key={d.id} onClick={() => toggleDriver(d.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: myDrivers.includes(d.id) ? `${getTC(d.team)}22` : "#12141a", border: `1.5px solid ${myDrivers.includes(d.id) ? getTC(d.team) : "#2d3139"}`, borderRadius: 8, cursor: "pointer", width: "100%" }}>
                  <div style={{ width: 4, height: 24, borderRadius: 2, background: getTC(d.team) }} />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Titillium Web', sans-serif" }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: "#8a8f98", fontWeight: 600, textTransform: "uppercase" }}>{getTeam(d.team).name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#8a8f98", fontWeight: 700 }}>${d.price}M</div>
                    {hasData && coefficients[d.id]?.composite > 0 && <div style={{ fontSize: 9, color: "#FF8000" }}>⚡{coefficients[d.id].composite.toFixed(2)}</div>}
                  </div>
                </button>
              ))}
            </div>
            <div style={S.lbl()}>Constructors</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {TEAMS.map(t => (
                <button key={t.id} onClick={() => toggleConstructor(t.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: myConstructors.includes(t.id) ? `${t.color}22` : "#12141a", border: `1.5px solid ${myConstructors.includes(t.id) ? t.color : "#2d3139"}`, borderRadius: 8, cursor: "pointer" }}>
                  <div style={{ width: 4, height: 24, borderRadius: 2, background: t.color }} />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Titillium Web', sans-serif" }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: "#8a8f98" }}>{t.engine} PU</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#8a8f98", fontWeight: 700 }}>${t.price}M</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CALCULATOR ═══ */}
        {tab === "calculator" && (
          <div className="fi">
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: "#8a8f98", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, display: "block" }}>Driver</label>
              <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#1a1d24", border: `2px solid ${getTC(drv.team)}`, borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: "'Titillium Web', sans-serif", fontWeight: 700, outline: "none" }}>
                {DRIVERS.map(d => <option key={d.id} value={d.id}>#{d.num} {d.name} — {getTeam(d.team).name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}><Toggle value={isSprint} onChange={setIsSprint} label="Sprint Weekend" color="#FF8000" /></div>
            <div style={S.card}>
              <div style={S.lbl()}>Race Weekend Input</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
                <NumInput label="Quali Pos" value={driverInput.qualiPos} onChange={(v) => setDriverInput({ ...driverInput, qualiPos: v })} />
                <NumInput label="Race Pos" value={driverInput.racePos} onChange={(v) => setDriverInput({ ...driverInput, racePos: v })} />
                <NumInput label="Overtakes" value={driverInput.overtakes} onChange={(v) => setDriverInput({ ...driverInput, overtakes: v })} max={30} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                <Toggle value={driverInput.dnf} onChange={(v) => setDriverInput({ ...driverInput, dnf: v })} label="DNF/DSQ" />
                <Toggle value={driverInput.fastestLap} onChange={(v) => setDriverInput({ ...driverInput, fastestLap: v })} label="Fastest Lap" />
                <Toggle value={driverInput.dotd} onChange={(v) => setDriverInput({ ...driverInput, dotd: v })} label="DOTD" />
              </div>
              {isSprint && <div style={{ borderTop: "1px solid #2d3139", paddingTop: 12 }}><div style={{ fontSize: 10, color: "#FF8000", fontWeight: 700, marginBottom: 8 }}>SPRINT</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}><NumInput label="Sprint Q" value={driverInput.sprintQualiPos} onChange={(v) => setDriverInput({ ...driverInput, sprintQualiPos: v })} /><NumInput label="Sprint Pos" value={driverInput.sprintPos} onChange={(v) => setDriverInput({ ...driverInput, sprintPos: v })} /><NumInput label="Sprint OT" value={driverInput.sprintOvertakes} onChange={(v) => setDriverInput({ ...driverInput, sprintOvertakes: v })} max={20} /></div><div style={{ display: "flex", gap: 12 }}><Toggle value={driverInput.sprintDnf} onChange={(v) => setDriverInput({ ...driverInput, sprintDnf: v })} label="Sprint DNF" /><Toggle value={driverInput.sprintFastestLap} onChange={(v) => setDriverInput({ ...driverInput, sprintFastestLap: v })} label="Sprint FL" /></div></div>}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Toggle value={boost} onChange={(v) => { setBoost(v); if (v) setActiveChip(null); }} label="2x Boost" />
              <select value={activeChip || ""} onChange={(e) => { setActiveChip(e.target.value || null); if (e.target.value) setBoost(false); }} style={{ padding: "6px 10px", background: "#1a1d24", border: "1px solid #2d3139", borderRadius: 6, color: "#fff", fontSize: 11, fontFamily: "'Titillium Web', sans-serif" }}><option value="">No Chip</option>{CHIPS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <ScoreCard label="Base" value={ds.total} />
              {(boost || activeChip === "3xboost") && <ScoreCard label={boost ? "2x" : "3x"} value={boost ? ds.total * 2 : ds.total * 3} color="#FF8000" />}
              <ScoreCard label="Final" value={nn} color="#fff" sub={`PPM: ${(nn / drv.price).toFixed(2)}`} />
            </div>
            <div style={S.card}><div style={S.lbl()}>Breakdown</div>{ds.breakdown.map((b, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1a1d24", fontSize: 12 }}><span style={{ color: "#c8ccd3" }}>{b.l}</span><span style={{ color: b.p >= 0 ? "#00d26a" : "#e10600", fontWeight: 700 }}>{b.p > 0 ? "+" : ""}{b.p}</span></div>)}{ds.breakdown.length === 0 && <div style={{ color: "#555", fontSize: 12, padding: 8 }}>No points</div>}</div>
          </div>
        )}

        {/* ═══ RULES ═══ */}
        {tab === "rules" && (
          <div className="fi">
            {[{ t: "Qualifying", c: "#6692FF", d: QUALI_POINTS, e: "NC/DSQ/No time: −5" }, { t: "Race", c: "#00d26a", d: RACE_POINTS, e: "DNF/DSQ: −20 · Pos gained: +1 · Pos lost: −1 · Overtakes: +1 · FL: +10 · DOTD: +10" }].map(sec => (
              <div key={sec.t} style={S.card}><div style={S.lbl(sec.c)}>{sec.t} Points</div><div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>{Object.entries(sec.d).map(([p, pts]) => <div key={p} style={{ textAlign: "center", padding: "5px 0", background: "#0d0f13", borderRadius: 5 }}><div style={{ fontSize: 9, color: "#8a8f98" }}>P{p}</div><div style={{ fontSize: 15, fontWeight: 900, color: sec.c }}>+{pts}</div></div>)}</div><div style={{ fontSize: 11, color: "#c8ccd3", lineHeight: 1.7 }}>{sec.e}</div></div>
            ))}
            <div style={S.card}><div style={S.lbl("#FF8000")}>Sprint Points</div><div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>{Object.entries(SPRINT_POINTS).map(([p, pts]) => <div key={p} style={{ textAlign: "center", padding: "5px 0", background: "#0d0f13", borderRadius: 5 }}><div style={{ fontSize: 9, color: "#8a8f98" }}>P{p}</div><div style={{ fontSize: 15, fontWeight: 900, color: "#FF8000" }}>+{pts}</div></div>)}</div><div style={{ fontSize: 11, color: "#c8ccd3", lineHeight: 1.7 }}>Sprint DNF: −10 · Sprint FL: +5 · +1/pos gained · −1/pos lost · +1/overtake</div></div>
            <div style={S.card}><div style={S.lbl("#27F4D2")}>Constructor Scoring</div><div style={{ fontSize: 11, color: "#c8ccd3", lineHeight: 1.9 }}>Both Q3: +10 · Both Q2: +5 · One Q3: +3 · One Q2: +1 · Both Q1: −1<br />Race: sum of both drivers' pts · DSQ: −20/driver</div><div style={{ marginTop: 10, fontSize: 10, fontWeight: 700, color: "#8a8f98", textTransform: "uppercase", marginBottom: 5 }}>Pit Stops</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(75px, 1fr))", gap: 3 }}>{PIT_POINTS.map(p => <div key={p.label} style={{ textAlign: "center", padding: 4, background: "#0d0f13", borderRadius: 5 }}><div style={{ fontSize: 9, color: "#8a8f98" }}>{p.label}</div><div style={{ fontSize: 13, fontWeight: 900, color: p.pts > 0 ? "#27F4D2" : "#555" }}>+{p.pts}</div></div>)}</div><div style={{ marginTop: 5, fontSize: 10, color: "#c8ccd3" }}>Fastest pit: +5 · Record (&lt;1.8s): +15</div></div>
          </div>
        )}

        {/* ═══ CHIPS ═══ */}
        {tab === "chips" && (
          <div className="fi">
            <div style={{ ...S.sub, marginBottom: 12 }}>Six chips, once each per season, one per weekend. Three from R1, three unlocked after R1.</div>
            <div style={{ display: "grid", gap: 8 }}>
              {CHIPS.map(c => <div key={c.id} style={{ ...S.card, display: "flex", gap: 14, alignItems: "center", marginBottom: 0 }}><div style={{ fontSize: 30, lineHeight: 1 }}>{c.icon}</div><div><div style={{ fontSize: 13, fontWeight: 900, marginBottom: 2 }}>{c.name}</div><div style={{ fontSize: 11, color: "#8a8f98", lineHeight: 1.4 }}>{c.desc}</div></div></div>)}
            </div>
            <div style={{ marginTop: 14, background: "linear-gradient(135deg, #27F4D222, #12141a)", border: "1px solid #27F4D244", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#27F4D2", marginBottom: 5 }}>Strategy Tips</div>
              <div style={{ fontSize: 11, color: "#c8ccd3", lineHeight: 1.8 }}><strong>Limitless</strong> on sprint weekends. <strong>No Negative</strong> on street circuits. <strong>3x Boost</strong> when confident in a dominant performance. <strong>Wildcard</strong> after 4-5 races once the pecking order settles.</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #1a1d24", padding: "12px 20px", textAlign: "center", marginTop: 24 }}><div style={{ fontSize: 9, color: "#555", letterSpacing: 1.5 }}>F1 FANTASY PREDICTOR · 2026 · OPENF1 API · LIVE FP DATA · LINEUP OPTIMIZER</div></div>
    </div>
  );
}
