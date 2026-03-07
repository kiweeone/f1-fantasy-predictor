import { useState } from "react";
import { Link } from "react-router-dom";

/* ═══════════════════════════════════════
   KIWEE.ONE — Landing Page
   Zhelyo Ivanov · Product Maker
   ═══════════════════════════════════════ */

const projects = [
  {
    title: "F1 Fantasy Predictor",
    subtitle: "2026 Season",
    desc: "Live practice session analysis engine that predicts qualifying and race performance for F1 Fantasy. Powered by OpenF1 telemetry data with configurable signals, tyre-adjusted pace modeling, and lineup optimization.",
    tags: ["React", "OpenF1 API", "Real-time Data", "Prediction Engine"],
    link: "/f1predictor",
    color: "#e10600",
    status: "Live",
  },
  {
    title: "Coming Soon",
    subtitle: "New Project",
    desc: "Something new is in the works.",
    tags: [],
    link: null,
    color: "#38383a",
    status: "Soon",
  },
];

export default function Landing() {
  const [hoveredProject, setHoveredProject] = useState(null);

  const font = "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", color: "#1a1a1a", fontFamily: font }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #1a1a1a; color: #fafafa; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease-out both; }
        .fade-up-2 { animation: fadeUp 0.6s ease-out 0.1s both; }
        .fade-up-3 { animation: fadeUp 0.6s ease-out 0.2s both; }
        .fade-up-4 { animation: fadeUp 0.6s ease-out 0.3s both; }
        .project-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .project-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.12); }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 40px", maxWidth: 1200, margin: "0 auto",
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>kiwee.one</span>
        <div style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 500, color: "#666" }}>
          <a href="#work" style={{ cursor: "pointer" }}>Work</a>
          <a href="#about" style={{ cursor: "pointer" }}>About</a>
          <a href="#contact" style={{ cursor: "pointer" }}>Contact</a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        maxWidth: 1200, margin: "0 auto", padding: "80px 40px 60px",
      }}>
        <div className="fade-up">
          <div style={{ fontSize: 14, fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: 3, marginBottom: 16 }}>
            Product Maker · Builder
          </div>
        </div>
        <h1 className="fade-up-2" style={{
          fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 800, letterSpacing: -3,
          lineHeight: 1.0, marginBottom: 24, color: "#1a1a1a",
        }}>
          Zhelyo<br />Ivanov
        </h1>
        <p className="fade-up-3" style={{
          fontSize: 20, lineHeight: 1.6, color: "#666", maxWidth: 560,
        }}>
          Building products at the intersection of data, design, and real-world impact. Currently exploring AI-powered tools and predictive systems.
        </p>
      </section>

      {/* ─── PROJECTS ─── */}
      <section id="work" style={{
        maxWidth: 1200, margin: "0 auto", padding: "40px 40px 80px",
      }}>
        <div className="fade-up-3" style={{
          fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase",
          letterSpacing: 3, marginBottom: 32,
        }}>
          Selected Projects
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
          {projects.map((p, i) => {
            const isLink = !!p.link;
            const Wrapper = isLink ? Link : "div";
            const wrapperProps = isLink ? { to: p.link } : {};

            return (
              <Wrapper
                key={i}
                {...wrapperProps}
                className="project-card fade-up-4"
                onMouseEnter={() => setHoveredProject(i)}
                onMouseLeave={() => setHoveredProject(null)}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  overflow: "hidden",
                  border: "1px solid #eee",
                  cursor: isLink ? "pointer" : "default",
                  display: "block",
                }}
              >
                {/* Color bar top */}
                <div style={{ height: 4, background: p.color }} />

                <div style={{ padding: "32px 32px 28px" }}>
                  {/* Status badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2,
                      color: p.status === "Live" ? "#00a63e" : "#999",
                    }}>
                      {p.status === "Live" && "● "}{p.status}
                    </span>
                    {isLink && (
                      <span style={{ fontSize: 20, color: "#ccc", transition: "transform 0.2s", transform: hoveredProject === i ? "translateX(4px)" : "none" }}>→</span>
                    )}
                  </div>

                  <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4, color: "#1a1a1a" }}>
                    {p.title}
                  </h2>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#999", marginBottom: 16 }}>
                    {p.subtitle}
                  </div>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: "#666", marginBottom: 20 }}>
                    {p.desc}
                  </p>

                  {p.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 11, fontWeight: 600, padding: "4px 10px",
                          background: "#f5f5f5", borderRadius: 6, color: "#888",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{
        background: "#1a1a1a", color: "#fafafa",
        padding: "80px 40px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 60 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 3, marginBottom: 20 }}>
                About
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.2, marginBottom: 20 }}>
                Building things<br />that matter
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "#999" }}>
                Product leader with over a decade of experience shipping complex products — from experiential hardware projects to FinTech ecosystems serving 700K+ customers. Currently exploring the space where AI, real-time data, and user experience intersect.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "#999", marginTop: 16 }}>
                Based in Sofia, Bulgaria. Passionate about Formula 1, crypto since 2017, and building tools that give people an edge.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 3, marginBottom: 20 }}>
                Experience
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { role: "Chief Product Officer", company: "Credissimo", period: "Current", desc: "Leading 40+ person team across 5 brands" },
                  { role: "Product Maker", company: "Independent", period: "2024–Present", desc: "AI-powered tools, predictive systems, mobile concepts" },
                ].map((exp, i) => (
                  <div key={i} style={{ borderLeft: "2px solid #333", paddingLeft: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{exp.role}</div>
                    <div style={{ fontSize: 14, color: "#666", marginTop: 2 }}>{exp.company} · {exp.period}</div>
                    <div style={{ fontSize: 14, color: "#888", marginTop: 6 }}>{exp.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 3, marginTop: 40, marginBottom: 20 }}>
                Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Product Strategy", "Team Leadership", "FinTech", "AI / ML", "React", "Data Analysis", "UX Design", "Agile / Scrum"].map(skill => (
                  <span key={skill} style={{
                    fontSize: 12, fontWeight: 600, padding: "6px 14px",
                    background: "#2a2a2a", borderRadius: 8, color: "#aaa",
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{
        maxWidth: 1200, margin: "0 auto", padding: "80px 40px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 40 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: 3, marginBottom: 16 }}>
              Get in Touch
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5 }}>
              Let's build something.
            </h2>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 15, fontWeight: 600 }}>
            <a href="https://github.com/kiweeone" target="_blank" rel="noopener" style={{ color: "#666", borderBottom: "1px solid #ddd", paddingBottom: 2 }}>GitHub</a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noopener" style={{ color: "#666", borderBottom: "1px solid #ddd", paddingBottom: 2 }}>LinkedIn</a>
            <a href="https://x.com/" target="_blank" rel="noopener" style={{ color: "#666", borderBottom: "1px solid #ddd", paddingBottom: 2 }}>X</a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        borderTop: "1px solid #eee", padding: "24px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 1200, margin: "0 auto",
        fontSize: 13, color: "#bbb",
      }}>
        <span>© 2026 Zhelyo Ivanov</span>
        <span>kiwee.one</span>
      </footer>
    </div>
  );
}
