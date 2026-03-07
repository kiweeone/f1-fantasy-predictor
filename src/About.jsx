import { Link } from "react-router-dom";

export default function About() {
  const font = "'Inter', -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0f0", fontFamily: font, color: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:#1a1a1a;color:#fafafa}
        a{text-decoration:none;color:inherit}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp .5s ease-out both}
        .fu2{animation:fadeUp .5s ease-out .1s both}
        .fu3{animation:fadeUp .5s ease-out .2s both}
        :root { --pad: 48px; }
        @media (max-width: 768px) { :root { --pad: 32px; } }
      `}</style>

      {/* ─── BACK ─── */}
      <nav style={{ padding: "20px var(--pad)" }}>
        <Link to="/" style={{ fontSize: 14, fontWeight: 600, color: "#999", display: "inline-flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#1a1a1a"}
          onMouseLeave={e => e.currentTarget.style.color = "#999"}
        >← Back</Link>
      </nav>

      {/* ─── HEADER ─── */}
      <section className="fu1" style={{ padding: "12px var(--pad) 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderTop: "3px solid #1a1a1a", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <h1 style={{ fontSize: "clamp(56px, 10vw, 130px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95 }}>About</h1>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#666" }}>
            <div><a href="mailto:azikiwee@gmail.com" style={{ borderBottom: "1px solid #ccc" }}>azikiwee@gmail.com</a></div>
            <div>+359 887 947 625</div>
            <div><a href="https://www.linkedin.com/in/zhelyoivanov/" target="_blank" rel="noopener" style={{ borderBottom: "1px solid #ccc" }}>LinkedIn</a></div>
            <div><a href="https://github.com/kiweeone" target="_blank" rel="noopener" style={{ borderBottom: "1px solid #ccc" }}>GitHub</a></div>
          </div>
        </div>
      </section>

      {/* ─── BIO ─── */}
      <section className="fu2" style={{ padding: "0 var(--pad) 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid #ccc", paddingTop: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
          <div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
              My name is<br />Zhelyo Ivanov.
            </h2>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: "#444" }}>
            <p>
              For over a decade, I've been building products that others thought were impossible. I started by engineering interactive hardware installations, AR experiences, EdTech platforms, and guerrilla social campaigns. I then applied that technical product expertise to <strong style={{ color: "#1a1a1a" }}>FinTech</strong>, where I've launched platforms serving <strong style={{ color: "#1a1a1a" }}>700K+ customers</strong> and processing <strong style={{ color: "#1a1a1a" }}>€30M+</strong> in transactions annually.
            </p>
            <p style={{ marginTop: 14 }}>
              Whether it's experiential, digital platforms, or mobile ecosystems, I solve hard engineering problems and ship products that deliver real business impact at scale.
            </p>
            <p style={{ marginTop: 14 }}>
              I previously led experiential technology projects at <strong style={{ color: "#1a1a1a" }}>Saatchi & Saatchi</strong> and <strong style={{ color: "#1a1a1a" }}>Digitas Sofia</strong> for brands including <strong style={{ color: "#1a1a1a" }}>Nissan, Audi, Coca-Cola, Samsung, DSK Bank</strong>, and <strong style={{ color: "#1a1a1a" }}>Zagorka</strong>. Earned <strong style={{ color: "#1a1a1a" }}>10+ industry awards</strong> including Agency of the Year 2017.
            </p>
            <p style={{ marginTop: 14, color: "#999" }}>
              Based in Sofia, Bulgaria. Passionate about Formula 1, crypto since 2017, and building tools that give people an edge.
            </p>
          </div>
        </div>
      </section>

      {/* ─── JOURNEY ─── */}
      <section className="fu3" style={{ padding: "0 var(--pad) 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid #ccc", paddingTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 28 }}>My Journey</div>
          <div>
            {[
              { period: "2023 – Present", title: "Chief Product Officer", company: "Credissimo", desc: "Product ecosystem leadership — CPO managing 5 brands, 40+ person team, platform transformation. Led native mobile platform launch (50K downloads), BNPL marketplace, and multiple 0→1 product launches.", color: "#e10600" },
              { period: "2021 – 2023", title: "Product Development Manager", company: "Credissimo", desc: "Applied product expertise to FinTech — launched 3 products from 0→1 (€30M+ annual volume). Built Xtra.bg, PlatiPosle.bg (BNPL), and contributed to Nolus.io (DeFi).", color: "#FF8000" },
              { period: "2016 – 2021", title: "Director of Extraordinary", company: "Saatchi & Saatchi / Digitas Sofia", desc: "Built experiential/interactive products — robotic installations, AR experiences, national education platforms. Engineering-driven executions with measurable business impact. 10+ awards.", color: "#3671C6" },
            ].map((exp, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, padding: "24px 0", borderBottom: "1px solid #ddd" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{exp.period}</div>
                  <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{exp.company}</div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 2, background: exp.color }} />
                    <span style={{ fontSize: 17, fontWeight: 700 }}>{exp.title}</span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "#666" }}>{exp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SKILLS ─── */}
      <section style={{ padding: "0 var(--pad) 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid #ccc", paddingTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb", textTransform: "uppercase", letterSpacing: 3, marginBottom: 20 }}>Core Competencies</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              "0→1 Product Development", "Platform Strategy", "Full Product Lifecycle Management",
              "Multi-Brand Portfolio Leadership", "Product Roadmapping", "Technical Product Management",
              "Go-to-Market Strategy", "Hardware Integration", "Mobile UI Architecture",
              "API Integration", "Payment Systems", "Agile/Scrum", "OKRs & KPIs",
              "A/B Testing", "User Research", "Web3/DeFi",
            ].map(s => (
              <span key={s} style={{ fontSize: 13, fontWeight: 600, padding: "7px 16px", background: "#e8e8e8", borderRadius: 8, color: "#555" }}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CV ─── */}
      <section style={{ padding: "0 var(--pad) 80px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid #ccc", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Full CV</div>
            <div style={{ fontSize: 13, color: "#999" }}>Complete professional history, projects, and awards</div>
          </div>
          <a href="/cv.pdf" target="_blank" rel="noopener" style={{
            padding: "14px 32px", background: "#1a1a1a", color: "#fff", borderRadius: 10,
            fontSize: 15, fontWeight: 700, transition: "background 0.2s, transform 0.2s", display: "inline-block",
          }}
            onMouseEnter={e => { e.target.style.background = "#333"; e.target.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.target.style.background = "#1a1a1a"; e.target.style.transform = "none"; }}
          >Download CV →</a>
        </div>
      </section>

      <footer style={{
        background: "#1a1a1a", padding: "20px var(--pad)",
        display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555",
      }}>
        <span>© 2026 Zhelyo Ivanov</span>
        <Link to="/" style={{ color: "#555", transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color = "#fff"}
          onMouseLeave={e => e.target.style.color = "#555"}
        >kiwee.one</Link>
      </footer>
    </div>
  );
}
