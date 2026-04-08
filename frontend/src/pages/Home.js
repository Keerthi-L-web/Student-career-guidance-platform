import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../App.css";

/* ── Particle data (deterministic) ──────────────────────────────────────────── */
function useParticles(count = 18) {
  return useMemo(() => {
    const colors = ["#22d3ee", "#a78bfa", "#f59e0b", "#4ade80"];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 4 + (i % 5) * 3,
      left: `${(i * 17 + 5) % 100}%`,
      color: colors[i % colors.length],
      duration: `${12 + (i % 8) * 3}s`,
      delay: `${(i * 1.3) % 10}s`,
    }));
  }, [count]);
}

/* ── Feature data ───────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "⬡",
    colorClass: "feature-icon--cyan",
    title: "AI-Powered Matching",
    desc: "Our intelligent engine uses cosine similarity and weighted scoring across 8 interest dimensions to find your ideal career path.",
  },
  {
    icon: "◈",
    colorClass: "feature-icon--purple",
    title: "21+ Career Paths",
    desc: "Comprehensive database spanning CS & IT, Engineering, and Medical fields — each with detailed education roadmaps.",
  },
  {
    icon: "✦",
    colorClass: "feature-icon--amber",
    title: "Personalized Insights",
    desc: "Get breakdown scores for subjects, interests, and skills with actionable explanations for every recommendation.",
  },
  {
    icon: "◎",
    colorClass: "feature-icon--green",
    title: "Track Your Journey",
    desc: "Save profiles and recommendation history to the cloud. Compare results over time as your interests evolve.",
  },
];

/* ── Stats ──────────────────────────────────────────────────────────────────── */
const STATS = [
  { number: "21+", label: "Career Paths" },
  { number: "8", label: "Interest Dimensions" },
  { number: "5", label: "Skill Metrics" },
  { number: "3", label: "Industry Fields" },
];

/* ── Testimonials ───────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    text: "Career.Match.Studio helped me realize that my love for both coding and math made AI Engineering the perfect fit. The breakdown scores were eye-opening!",
    name: "Priya K.",
    role: "B.Tech CS Student",
    color: "linear-gradient(135deg, #22d3ee, #0891b2)",
  },
  {
    text: "I was torn between medicine and research. The interest-dimension analysis showed my true strengths in lab work — now I'm pursuing Medical Lab Science.",
    name: "Arjun M.",
    role: "12th Grade Science",
    color: "linear-gradient(135deg, #a78bfa, #7c3aed)",
  },
  {
    text: "The history feature is brilliant. I ran the analysis three times as my interests changed, and could clearly see my path converging toward Robotics.",
    name: "Sarah L.",
    role: "Engineering Aspirant",
    color: "linear-gradient(135deg, #4ade80, #16a34a)",
  },
];

export default function Home() {
  const { currentUser } = useAuth();
  const particles = useParticles();

  return (
    <div className="landing">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="hero-particles">
          {particles.map((p) => (
            <div
              key={p.id}
              className="hero-particle"
              style={{
                width: p.size,
                height: p.size,
                left: p.left,
                background: p.color,
                animationDuration: p.duration,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            INTELLIGENT CAREER ENGINE
          </div>

          <h1 className="hero-title">
            Find your <em>ideal</em>
            <br />
            career path
          </h1>

          <p className="hero-subtitle">
            Discover the perfect career match based on your interests, skills,
            and academic subjects. Our intelligent engine uses advanced
            algorithms across 8 dimensions to find your path.
          </p>

          <div className="hero-actions">
            {currentUser ? (
              <Link to="/dashboard" className="hero-btn-primary">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="hero-btn-primary">
                  Get Started Free →
                </Link>
                <Link to="/login" className="hero-btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="landing-stats">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="stat-item"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="stat-number">{s.number}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="section-eyebrow">How It Works</div>
        <h2 className="section-title">
          Powered by <em>intelligent</em> analysis
        </h2>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feature-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`feature-icon ${f.colorClass}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="landing-testimonials">
        <div className="section-eyebrow">Student Stories</div>
        <h2 className="section-title" style={{ textAlign: "center" }}>
          What students <em>say</em>
        </h2>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="testimonial-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div
                  className="testimonial-avatar"
                  style={{ background: t.color, color: "#fff" }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to discover your path?
          </h2>
          <p className="cta-subtitle">
            Join students who have already found their ideal career direction
            using our intelligent matching engine.
          </p>
          <Link
            to={currentUser ? "/dashboard" : "/register"}
            className="hero-btn-primary"
          >
            {currentUser ? "Go to Dashboard →" : "Start Your Analysis →"}
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            Career.Match.Studio © {new Date().getFullYear()}
          </div>
          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to={currentUser ? "/dashboard" : "/register"}>
              Dashboard
            </Link>
            <Link to={currentUser ? "/profile" : "/register"}>Profile</Link>
            <Link to={currentUser ? "/history" : "/register"}>History</Link>
          </div>
          <div className="footer-copy">
            Intelligent Student Career Guidance & Decision Support Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
