import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  saveStudentProfile,
  getStudentProfile,
  saveRecommendationHistory,
} from "../firebase/firestoreService";
import "../App.css";

/* ── Constants ──────────────────────────────────────────────────────────────── */
const DIMS = {
  CODE: "Coding / Software",
  AI: "AI & Machine Learning",
  DATA: "Data & Analytics",
  PHYS: "Physics & Maths",
  BIO: "Biology",
  CHEM: "Chemistry",
  ELEC: "Electronics & HW",
  RESEARCH: "Research",
};
const ALL_DIMS = Object.values(DIMS);
const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Biology",
  "Chemistry",
  "Computer Science",
];
const WORK_ENVS = [
  "Office/Tech",
  "Hospital/Clinical",
  "Field/On-site",
  "Research/Lab",
  "Mixed",
];
const SKILL_DIMS = [
  "Programming",
  "Problem Solving",
  "Logical Thinking",
  "Math Aptitude",
  "Communication",
];
const GOAL_OPTS = [
  "High Salary",
  "Innovation",
  "Research",
  "Job Stability",
  "Entrepreneurship",
  "Social Impact",
  "Work-Life Balance",
  "Leadership",
];

const FIELD_CFG = {
  "CS & IT": { color: "#22d3ee", icon: "⬡" },
  Engineering: { color: "#f59e0b", icon: "⚙" },
  Medical: { color: "#4ade80", icon: "✦" },
};

const scoreColor = (s) =>
  s >= 80 ? "#4ade80" : s >= 60 ? "#22d3ee" : s >= 40 ? "#f59e0b" : "#f87171";

/* ── Slider ─────────────────────────────────────────────────────────────────── */
function Slider({ label, value, onChange }) {
  return (
    <div className="slider-row">
      <span className="sl-name">{label}</span>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="sl-val">{value}</span>
    </div>
  );
}

/* ── Career Card ────────────────────────────────────────────────────────────── */
function CareerCard({ rec, idx }) {
  const [open, setOpen] = useState(false);
  const cfg = FIELD_CFG[rec.field] || { color: "#94a3b8", icon: "◈" };
  const rankLabels = [
    "#1 Best Match",
    "#2 Match",
    "#3 Match",
    "#4 Match",
    "#5 Match",
  ];
  const sc = scoreColor(rec.matchingScore);

  return (
    <div className="card" style={{ animationDelay: `${idx * 0.07}s` }}>
      <div className="card-main" onClick={() => setOpen((o) => !o)}>
        <div className="card-row1">
          <span className="card-rank" style={{ color: cfg.color }}>
            {cfg.icon} {rankLabels[idx] || `#${idx + 1}`}
          </span>
          <span
            className="card-field"
            style={{
              background: `${cfg.color}14`,
              color: cfg.color,
              border: `1px solid ${cfg.color}30`,
            }}
          >
            {rec.field}
          </span>
        </div>
        <div className="card-row2">
          <span className="card-name">{rec.careerName}</span>
          <span className="card-score" style={{ color: sc }}>
            {rec.matchingScore}%
          </span>
        </div>
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{
              width: `${rec.matchingScore}%`,
              background: `linear-gradient(90deg,${sc}70,${sc})`,
            }}
          />
        </div>
      </div>

      <div className="card-why">{rec.whyThisCareer}</div>

      {/* Sub-score breakdown */}
      <div className="breakdown">
        {[
          { label: "SUBJECT", pct: rec.subjectPct, color: "#22d3ee" },
          { label: "INTEREST", pct: rec.interestPct, color: "#a78bfa" },
          { label: "SKILLS", pct: rec.skillPct, color: "#4ade80" },
        ].map(({ label, pct, color }) => (
          <div key={label} className="brow">
            <span className="blabel">{label}</span>
            <div className="btrack">
              <div
                className="bfill"
                style={{ width: `${pct}%`, background: color + "90" }}
              />
            </div>
            <span className="bval" style={{ color }}>
              {pct}%
            </span>
          </div>
        ))}
      </div>

      <div className="card-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "HIDE" : "EDUCATION & SKILLS"}
        <span className={`chev ${open ? "open" : ""}`}>↓</span>
      </div>

      {open && (
        <div className="card-detail">
          <div>
            <div className="detail-label">Key Skills Required</div>
            <div className="skill-pills">
              {rec.requiredKeySkills.map((s) => (
                <span key={s} className="skill-pill">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="detail-label">Suggested Education Path</div>
            <div className="edu-text">{rec.suggestedEducationPath}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────────── */
function Toast({ message, type = "success" }) {
  if (!message) return null;
  return (
    <div className={`toast ${type === "error" ? "toast--error" : ""}`}>
      {message}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState(["Mathematics", "Computer Science"]);
  const [interests, setInterests] = useState({
    [DIMS.CODE]: 4,
    [DIMS.AI]: 3,
    [DIMS.DATA]: 2,
    [DIMS.PHYS]: 3,
    [DIMS.BIO]: 2,
    [DIMS.CHEM]: 2,
    [DIMS.ELEC]: 2,
    [DIMS.RESEARCH]: 2,
  });
  const [skills, setSkills] = useState({
    Programming: 4,
    "Problem Solving": 4,
    "Logical Thinking": 4,
    "Math Aptitude": 3,
    Communication: 3,
  });
  const [env, setEnv] = useState("Office/Tech");
  const [goals, setGoals] = useState(["High Salary", "Innovation"]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const resultsRef = useRef(null);

  /* Show toast helper */
  const showToast = useCallback((msg, type = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  }, []);

  /* Load saved profile from Firestore on mount (with 5s timeout) */
  useEffect(() => {
    if (!currentUser) { setProfileLoaded(true); return; }
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("Firestore profile load timed out — using defaults");
        setProfileLoaded(true);
      }
    }, 5000);

    (async () => {
      try {
        const saved = await getStudentProfile(currentUser.uid);
        if (saved && !cancelled) {
          if (saved.favoriteSubjects) setSubjects(saved.favoriteSubjects);
          if (saved.interestAreas) setInterests(saved.interestAreas);
          if (saved.skills) setSkills(saved.skills);
          if (saved.preferredWorkEnvironment)
            setEnv(saved.preferredWorkEnvironment);
          if (saved.careerGoals) setGoals(saved.careerGoals);
        }
      } catch (err) {
        console.warn("Could not load saved profile:", err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [currentUser]);

  const buildProfile = () => ({
    favoriteSubjects: subjects,
    interestAreas: interests,
    skills,
    preferredWorkEnvironment: env,
    careerGoals: goals,
    userEmail: currentUser?.email,
  });

  const handleAnalyse = async () => {
    setLoading(true);
    setDone(false);

    try {
      const profile = buildProfile();
      const res = await fetch("http://127.0.0.1:8000/api/recommend/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      setRecs(data.recommendations);
      setDone(true);

      // Save profile & history to Firestore (non-blocking)
      if (currentUser) {
        saveStudentProfile(currentUser.uid, profile).catch(console.warn);
        saveRecommendationHistory(
          currentUser.uid,
          profile,
          data.recommendations
        ).catch(console.warn);
        showToast("Profile & results saved to cloud ✓");
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    } catch (err) {
      console.error("API ERROR:", err);
      showToast("Failed to get recommendations. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = resultsRef.current;
      if (!element) return;

      const opt = {
        margin: [10, 10],
        filename: "career-recommendations.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: "#07090f" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(element).save();
      showToast("PDF exported successfully ✓");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("PDF export failed", "error");
    }
  };

  const toggle = (arr, setArr, val) =>
    setArr((p) => (p.includes(val) ? p.filter((x) => x !== val) : [...p, val]));

  /* Radar chart data */
  const radarData = ALL_DIMS.map((d) => ({
    dim: d.replace(/ & /g, "/").replace("Coding / ", ""),
    value: interests[d] ?? 1,
  }));

  if (!profileLoaded) {
    return (
      <div className="app">
        <div className="empty" style={{ paddingTop: 120 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
          <p className="empty-text">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Toast message={toast} type={toastType} />

      {/* HERO */}
      <div className="hero" style={{ paddingBottom: "30px", paddingTop: "10px" }}>
        <div>
          <div className="eyebrow">Dashboard</div>
          <h1 className="title">
            Analyze your <em>career</em> path
          </h1>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid">
        {/* ── LEFT: FORM ── */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-label">Your Profile</div>
            <div className="panel-title">Build &amp; Analyse</div>
          </div>
          <div className="panel-body">
            <div className="section">
              <div className="sec-label">Favourite Subjects</div>
              <div className="chips">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    className={`chip ${subjects.includes(s) ? "chip-subj" : ""}`}
                    onClick={() => toggle(subjects, setSubjects, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Interest Areas (1–5)</div>
              {ALL_DIMS.map((d) => (
                <Slider
                  key={d}
                  label={d}
                  value={interests[d] ?? 1}
                  onChange={(v) => setInterests((p) => ({ ...p, [d]: v }))}
                />
              ))}
            </div>

            {/* Mini radar chart */}
            <div
              style={{
                height: 220,
                margin: "8px -10px 8px",
                opacity: 0.85,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,.07)" />
                  <PolarAngleAxis
                    dataKey="dim"
                    tick={{ fill: "#6b7a96", fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 5]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#22d3ee"
                    fill="#22d3ee"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0c0f18",
                      border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Skills (1–5)</div>
              {SKILL_DIMS.map((d) => (
                <Slider
                  key={d}
                  label={d}
                  value={skills[d] ?? 1}
                  onChange={(v) => setSkills((p) => ({ ...p, [d]: v }))}
                />
              ))}
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Preferred Work Environment</div>
              <div className="chips">
                {WORK_ENVS.map((e) => (
                  <button
                    key={e}
                    className={`chip ${env === e ? "chip-env" : ""}`}
                    onClick={() => setEnv(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Career Goals</div>
              <div className="chips">
                {GOAL_OPTS.map((g) => (
                  <button
                    key={g}
                    className={`chip ${goals.includes(g) ? "chip-goal" : ""}`}
                    onClick={() => toggle(goals, setGoals, g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <button
              className="submit-btn"
              onClick={handleAnalyse}
              disabled={loading}
              id="analyse-btn"
            >
              {loading && <span className="shimmer" />}
              {loading ? "Analysing…" : "Analyse My Profile →"}
            </button>
          </div>
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <div className="panel" ref={resultsRef}>
          <div className="panel-header">
            <div className="panel-row">
              <div>
                <div className="panel-label">Results</div>
                <div className="panel-title">Top Career Matches</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {done && recs.length > 0 && (
                  <>
                    <div className="count-badge">{recs.length} careers ranked</div>
                    <button
                      className="export-btn"
                      onClick={handleExportPDF}
                      title="Export results as PDF"
                    >
                      📄 Export PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="skels">
              {[130, 115, 115, 110, 110].map((h, i) => (
                <div
                  key={i}
                  className="skel"
                  style={{ height: h, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}

          {!loading && !done && (
            <div className="empty">
              <div className="empty-glyph">[ _ ]</div>
              <p className="empty-text">
                Fill in your profile on the left, then click{" "}
                <strong>Analyse My Profile</strong>. Results also update live as
                you adjust sliders after the first run.
              </p>
            </div>
          )}

          {!loading && done && recs.length === 0 && (
            <div className="empty">
              <div className="empty-glyph">◌</div>
              <p className="empty-text">
                No results. Try selecting more subjects or raising interest
                sliders.
              </p>
            </div>
          )}

          {!loading && recs.length > 0 && (
            <div className="cards">
              {recs.map((rec, idx) => (
                <CareerCard key={rec.careerName} rec={rec} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
