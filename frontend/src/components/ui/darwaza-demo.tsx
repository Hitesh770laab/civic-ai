"use client"

import DarwazaPreloader from "@/components/ui/darwaza-preloader"

const WORK = [
  { n: "01", t: "Sector 17 Plaza Revitalisation", d: "Civic infrastructure audit and pedestrian lighting survey.", c: "#1d4936" },
  { n: "02", t: "Sukhna Lake Promenade Works", d: "Public tender and water filtration monitoring system.", c: "#265942" },
  { n: "03", t: "Smart Solar Grid & RTS Tracking", d: "Enforcing statutory repair timelines across Chandigarh UT.", c: "#d4af37" },
]

// Load, then scroll: the doors open onto the page behind them.
export default function DarwazaDemo() {
  return (
    <DarwazaPreloader preset="chandigarh" title="CIVIC AI CHANDIGARH">
      <main style={{ minHeight: "100vh", background: "#f7f8f5", color: "#1e2922", padding: "40px 24px" }}>
        <section style={{ maxWidth: "800px", margin: "60px auto 40px", textAlign: "center" }}>
          <p style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#2d6a4f" }}>
            Chandigarh Civic Intelligence Platform · 2026
          </p>
          <h1 style={{ fontFamily: "serif", fontSize: "48px", lineHeight: "1.1", margin: "16px 0", color: "#123324" }}>
            Chandigarh built with <em style={{ color: "#1d4936", fontStyle: "italic" }}>purpose</em> and citizen care.
          </h1>
          <p style={{ fontSize: "16px", color: "#48544b", maxWidth: "600px", margin: "0 auto" }}>
            Documenting civic issues, enforcing municipal repair standards, and tracking public works in Chandigarh.
          </p>
        </section>

        <section style={{ maxWidth: "900px", margin: "0 auto 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {WORK.map((w) => (
              <article key={w.n} style={{ background: "#ffffff", border: "1px solid #e3e8e1", borderRadius: "16px", padding: "24px" }}>
                <div style={{ height: "90px", borderRadius: "10px", background: w.c, marginBottom: "16px" }} />
                <p style={{ fontFamily: "monospace", fontSize: "11px", color: "#727f75" }}>{w.n}</p>
                <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "6px 0", color: "#1b261f" }}>{w.t}</h2>
                <p style={{ fontSize: "13px", color: "#727f75", lineHeight: "1.5" }}>{w.d}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </DarwazaPreloader>
  )
}
