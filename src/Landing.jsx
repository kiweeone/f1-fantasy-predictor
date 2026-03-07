import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const bands = [
  { title: "F1 Predictor", role: "AI-Powered Fantasy Tool", bg: "#e10600", color: "#fff", link: "/f1predictor", live: true },
  { title: "FinTech", role: "Platform Architect", bg: "#1a1a1a", color: "#fff", link: null, live: false },
  { title: "Creative", role: "Experiential & Interactive", bg: "#FF8000", color: "#fff", link: null, live: false },
  { title: "EdTech", role: "Interactive Learning Platform", bg: "#3671C6", color: "#fff", link: null, live: false },
  { title: "About", role: "Chief Product Officer | Technical Product Leader", bg: "#f5c518", color: "#1a1a1a", link: "/about", live: false },
];

const skills = [
  "0→1 Product Development", "Platform Strategy", "Full Product Lifecycle Management",
  "Multi-Brand Portfolio Leadership", "Product Roadmapping", "Technical Product Management",
  "Go-to-Market Strategy",
];

export default function Landing() {
  const [hov, setHov] = useState(null);
  const font = "'Inter', -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#1a1a1a;color:#fafafa}
        a{text-decoration:none;color:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .6s ease-out both}

        /* ─── RESPONSIVE VARS ─── */
        :root { --pad: 48px; --title-size: clamp(64px, 10vw, 130px); --band-size: clamp(48px, 7vw, 100px); }

        @media (max-width: 768px) {
          :root { --pad: 32px; --title-size: clamp(48px, 14vw, 80px); --band-size: clamp(36px, 10vw, 64px); }
        }

        .band{transition:all .35s cubic-bezier(.16,1,.3,1);display:flex;justify-content:space-between;align-items:center}
        @media (max-width: 768px) {
          .band{flex-direction:column!important;align-items:flex-start!important;gap:6px!important}
        }
        @media (min-width: 769px) {
          .band:hover{padding-top:56px;padding-bottom:56px}
        }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="fu" style={{ padding: "var(--pad)", paddingTop: "calc(var(--pad) + 40px)", paddingBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h1 style={{
            fontSize: "var(--title-size)", fontWeight: 900, letterSpacing: "-0.04em",
            lineHeight: 0.95, color: "#1a1a1a",
          }}>
            Zhelyo Ivanov
          </h1>
          <span className="hero-title" style={{ fontSize: 14, fontWeight: 500, color: "#999", flexShrink: 0 }}>
            Chief Product Officer
          </span>
        </div>
      </section>

      {/* ─── BANDS ─── */}
      <section className="fu">
        {bands.map((p, i) => {
          const isLink = !!p.link;
          const Wrapper = isLink ? Link : "div";
          const wrapperProps = isLink ? { to: p.link } : {};

          return (
            <Wrapper
              key={i}
              {...wrapperProps}
              className="band"
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                padding: "36px var(--pad)", background: p.bg, color: p.color,
                cursor: isLink ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "var(--band-size)", fontWeight: 900,
                  letterSpacing: "-0.03em", lineHeight: 1.05,
                }}>
                  {p.title}
                </span>
                {p.live && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2,
                    background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 4,
                  }}>
                    ● Live
                  </span>
                )}
              </div>
              {/* Role text — right-aligned, vertically centered, no arrow */}
              <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.6 }}>{p.role}</span>
            </Wrapper>
          );
        })}
      </section>

      {/* ─── SKILLS ─── */}
      <section style={{ background: "#f0f0f0", padding: "60px var(--pad)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 24 }}>
            Core Competencies
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {skills.map(s => (
              <span key={s} style={{
                fontSize: 14, fontWeight: 600, padding: "8px 18px",
                background: "#fff", borderRadius: 10, color: "#444", border: "1px solid #e5e5e5",
              }}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section style={{ background: "#1a1a1a", color: "#fafafa", padding: "80px var(--pad)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(28px, 5vw, 64px)", fontWeight: 900,
            letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 32,
          }}>
            Let's build something<br />together.
          </h2>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 15, fontWeight: 500 }}>
            {[
              { label: "azikiwee@gmail.com", href: "mailto:azikiwee@gmail.com" },
              { label: "LinkedIn", href: "https://www.linkedin.com/in/zhelyoivanov/" },
              { label: "GitHub", href: "https://github.com/kiweeone" },
            ].map(l => (
              <a key={l.label} href={l.href} target={l.href.startsWith("mailto") ? undefined : "_blank"} rel="noopener"
                style={{ color: "#999", borderBottom: "1px solid #444", paddingBottom: 4, transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = "#fff"}
                onMouseLeave={e => e.target.style.color = "#999"}
              >{l.label}</a>
            ))}
          </div>
        </div>
      </section>

      <footer style={{
        background: "#1a1a1a", borderTop: "1px solid #333", padding: "20px var(--pad)",
        display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555",
      }}>
        <span>© 2026 Zhelyo Ivanov</span>
        <span>kiwee.one</span>
      </footer>
    </div>
  );
}
