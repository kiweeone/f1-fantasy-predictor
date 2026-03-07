import { useState } from "react";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════
   KIWEE.ONE — Landing Page
   Inspired by actualidea.com
   Full-bleed bands, oversized type
   ═══════════════════════════════════════ */

const projects = [
  {
    title: "F1 Predictor",
    role: "AI-Powered Fantasy Tool",
    bg: "#e10600",
    color: "#fff",
    link: "/f1predictor",
    live: true,
  },
  {
    title: "FinTech",
    role: "Platform Architect",
    bg: "#1a1a1a",
    color: "#fff",
    link: null,
    live: false,
  },
  {
    title: "Ekistics",
    role: "Neighborhood Discovery App",
    bg: "#FF8000",
    color: "#fff",
    link: null,
    live: false,
  },
  {
    title: "EdTech",
    role: "Interactive Learning Platform",
    bg: "#3671C6",
    color: "#fff",
    link: null,
    live: false,
  },
];

const skills = [
  "0→1 Product Development",
  "Platform Strategy",
  "Full Product Lifecycle Management",
  "Multi-Brand Portfolio Leadership",
  "Product Roadmapping",
  "Technical Product Management",
  "Go-to-Market Strategy",
];

export default function Landing() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const font = "'Inter', -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif";
  const fontDisplay = "'Inter', -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: font }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #1a1a1a; color: #fafafa; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .fu1 { animation: fadeUp 0.7s ease-out both; }
        .fu2 { animation: fadeUp 0.7s ease-out 0.1s both; }
        .fu3 { animation: fadeUp 0.7s ease-out 0.2s both; }
        .band { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .band:hover { padding-top: 60px; padding-bottom: 60px; }
        .band-arrow { transition: transform 0.3s ease, opacity 0.3s ease; opacity: 0; transform: translateX(-10px); }
        .band:hover .band-arrow { opacity: 1; transform: translateX(0); }
      `}</style>

      {/* ─── HERO ─── */}
      <section style={{
        padding: "60px 48px 40px",
        maxWidth: 1400,
        margin: "0 auto",
        minHeight: "45vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}>
        <div className="fu1" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{
            fontSize: "clamp(64px, 10vw, 140px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            color: "#1a1a1a",
            fontFamily: fontDisplay,
          }}>
            Zhelyo<br />Ivanov
          </h1>
          <div className="fu2" style={{ textAlign: "right", paddingTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#999", letterSpacing: 1, textTransform: "uppercase" }}>
              Chief Product Officer
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
              Technical Product Leader
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROJECT BANDS ─── */}
      <section className="fu3">
        {projects.map((p, i) => {
          const isLink = !!p.link;
          const Wrapper = isLink ? Link : "div";
          const wrapperProps = isLink ? { to: p.link } : {};

          return (
            <Wrapper
              key={i}
              {...wrapperProps}
              className="band"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "44px 48px",
                background: p.bg,
                color: p.color,
                cursor: isLink ? "pointer" : "default",
                borderTop: i === 0 ? "none" : `1px solid ${p.bg}`,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 20, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "clamp(48px, 7vw, 100px)",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  fontFamily: fontDisplay,
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

      {/* ─── ABOUT ─── */}
      <section style={{
        padding: "100px 48px",
        maxWidth: 900,
        margin: "0 auto",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 28 }}>
          About
        </div>
        <p style={{
          fontSize: "clamp(18px, 2.2vw, 24px)",
          lineHeight: 1.7,
          color: "#444",
          fontWeight: 400,
        }}>
          For over a decade, I've been building products that others thought were impossible. I started by engineering interactive hardware installations, AR experiences, EdTech platforms, and guerrilla social campaigns. I then applied that technical product expertise to FinTech, where I've launched platforms serving 700K+ customers and processing €30M+ in transactions annually. Whether it's experiential, digital platforms, or mobile ecosystems, I solve hard engineering problems and ship products that deliver real business impact at scale.
        </p>

        <a
          href="/cv.pdf"
          target="_blank"
          rel="noopener"
          style={{
            display: "inline-block",
            marginTop: 32,
            padding: "14px 32px",
            background: "#1a1a1a",
            color: "#fff",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
            transition: "background 0.2s, transform 0.2s",
          }}
          onMouseEnter={e => { e.target.style.background = "#333"; e.target.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.target.style.background = "#1a1a1a"; e.target.style.transform = "none"; }}
        >
          Click here for more →
        </a>
      </section>

      {/* ─── SKILLS ─── */}
      <section style={{
        background: "#f0f0f0",
        padding: "80px 48px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 28 }}>
            Core Competencies
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {skills.map(skill => (
              <span key={skill} style={{
                fontSize: 15,
                fontWeight: 600,
                padding: "10px 22px",
                background: "#fff",
                borderRadius: 10,
                color: "#444",
                border: "1px solid #e5e5e5",
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section style={{
        background: "#1a1a1a",
        color: "#fafafa",
        padding: "100px 48px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 40,
            fontFamily: fontDisplay,
          }}>
            Let's build something<br />together.
          </h2>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", fontSize: 16, fontWeight: 500 }}>
            <a href="mailto:azikiwee@gmail.com" style={{
              color: "#999", borderBottom: "1px solid #444", paddingBottom: 4,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "#999"}
            >
              azikiwee@gmail.com
            </a>
            <a href="https://www.linkedin.com/in/zhelyoivanov/" target="_blank" rel="noopener" style={{
              color: "#999", borderBottom: "1px solid #444", paddingBottom: 4,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "#999"}
            >
              LinkedIn
            </a>
            <a href="https://github.com/kiweeone" target="_blank" rel="noopener" style={{
              color: "#999", borderBottom: "1px solid #444", paddingBottom: 4,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "#999"}
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        background: "#1a1a1a",
        borderTop: "1px solid #333",
        padding: "20px 48px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        color: "#555",
      }}>
        <span>© 2026 Zhelyo Ivanov</span>
        <span>kiwee.one</span>
      </footer>
    </div>
  );
}
