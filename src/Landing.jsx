import { useState } from "react";
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
        .band{transition:all .35s cubic-bezier(.16,1,.3,1)}
        .band:hover{padding-top:56px;padding-bottom:56px}
        .band-arrow{transition:transform .3s ease,opacity .3s ease;opacity:0;transform:translateX(-10px)}
        .band:hover .band-arrow{opacity:1;transform:translateX(0)}
      `}</style>

      {/* ─── HERO — tight, left-aligned like the bands ─── */}
      <section className="fu" style={{ padding: "48px 48px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 0 }}>
          <h1 style={{
            fontSize: "clamp(64px, 10vw, 130px)", fontWeight: 900, letterSpacing: "-0.04em",
            lineHeight: 0.95, color: "#1a1a1a",
          }}>
            Zhelyo Ivanov
          </h1>
          <div style={{ textAlign: "right", paddingBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#999", letterSpacing: 1, textTransform: "uppercase" }}>
              Chief Product Officer
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
              Technical Product Leader
            </div>
          </div>
        </div>
      </section>

      {/* ─── BANDS ─── */}
      <section className="fu" style={{ marginTop: 0 }}>
        {bands.map((p, i) => {
          const isLink = !!p.link;
          const Wrapper = isLink ? Link : "div";
          const wrapperProps = isLink ? { to: p.link } : {};
          const isAbout = p.title === "About";

          return (
            <Wrapper
              key={i}
              {...wrapperProps}
              className="band"
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "40px 48px", background: p.bg, color: p.color,
                cursor: isLink ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "clamp(48px, 7vw, 100px)", fontWeight: 900,
                  letterSpacing: "-0.03em", lineHeight: 1,
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
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.7 }}>{p.role}</span>
                {isLink && <span className="band-arrow" style={{ fontSize: 28, fontWeight: 300 }}>→</span>}
              </div>
            </Wrapper>
          );
        })}
      </section>

      {/* ─── SKILLS ─── */}
      <section style={{ background: "#f0f0f0", padding: "80px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 28 }}>
            Core Competencies
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {skills.map(s => (
              <span key={s} style={{
                fontSize: 15, fontWeight: 600, padding: "10px 22px",
                background: "#fff", borderRadius: 10, color: "#444", border: "1px solid #e5e5e5",
              }}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section style={{ background: "#1a1a1a", color: "#fafafa", padding: "100px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900,
            letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 40,
          }}>
            Let's build something<br />together.
          </h2>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontSize: 16, fontWeight: 500 }}>
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
        background: "#1a1a1a", borderTop: "1px solid #333", padding: "20px 48px",
        display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555",
      }}>
        <span>© 2026 Zhelyo Ivanov</span>
        <span>kiwee.one</span>
      </footer>
    </div>
  );
}
