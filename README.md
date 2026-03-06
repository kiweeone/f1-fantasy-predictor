# F1 Fantasy Predictor 2026

Live FP analysis engine, lineup optimizer, and scoring calculator for F1 Fantasy 2026.  
Powered by [OpenF1 API](https://openf1.org) for real practice session data.

## Features

- **Predictor** — Performance coefficients from FP1/FP2/FP3 data (weighted 15/35/50%)
- **FP Data** — Auto-fetch from OpenF1 API or manual entry
- **Optimizer** — Top 5 lineup combinations under $100M budget
- **Team Builder** — Manual team construction with live budget tracking
- **Score Calculator** — Full 2026 scoring rules with chip support
- **Rules Reference** — Complete scoring tables for quali, race, sprint, constructors

## Signals

| Signal | Weight | Source |
|--------|--------|--------|
| Pace delta (vs session best) | 40% | Best lap time |
| Consistency | 25% | Std deviation of top 80% laps |
| Long run pace | 25% | Average of laps 4+ |
| Reliability | 10% | Total lap count |

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Connect repo at vercel.com
3. Deploy (zero config needed)

## Tech

- React 18 + Vite
- OpenF1 API (no auth needed for historical data)
- Zero backend — runs entirely in browser
