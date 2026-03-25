import { useState, useEffect, useRef } from "react";
import { recommendCareers, DIMS, ALL_DIMS } from "./engine";
import "./App.css";

// ── Constants ──────────────────────────────────────────────────────────────────
const SUBJECTS   = ["Mathematics", "Physics", "Biology", "Chemistry", "Computer Science"];
const WORK_ENVS  = ["Office/Tech", "Hospital/Clinical", "Field/On-site", "Research/Lab", "Mixed"];
const SKILL_DIMS = ["Programming", "Problem Solving", "Logical Thinking", "Math Aptitude", "Communication"];
const GOAL_OPTS  = ["High Salary", "Innovation", "Research", "Job Stability", "Entrepreneurship", "Social Impact", "Work-Life Balance", "Leadership"];

const FIELD_CFG = {
  "CS & IT":    { color: "#22d3ee", icon: "⬡" },
  "Engineering":{ color: "#f59e0b", icon: "⚙" },
  "Medical":    { color: "#4ade80", icon: "✦" },
};

const scoreColor = s =>
  s >= 80 ? "#4ade80" : s >= 60 ? "#22d3ee" : s >= 40 ? "#f59e0b" : "#f87171";

// ── Slider ─────────────────────────────────────────────────────────────────────
function Slider({ label, value, onChange }) {
  return (
    <div className="slider-row">
      <span className="sl-name">{label}</span>
      <input type="range" min={1} max={5} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <span className="sl-val">{value}</span>
    </div>
  );
}

// ── Career Card ────────────────────────────────────────────────────────────────
function CareerCard({ rec, idx }) {
  const [open, setOpen] = useState(false);
  const cfg = FIELD_CFG[rec.field] || { color: "#94a3b8", icon: "◈" };
  const rankLabels = ["#1 Best Match", "#2 Match", "#3 Match", "#4 Match", "#5 Match"];
  const sc = scoreColor(rec.matchingScore);

  return (
    <div className="card" style={{ animationDelay: `${idx * 0.07}s` }}>
      <div className="card-main" onClick={() => setOpen(o => !o)}>
        <div className="card-row1">
          <span className="card-rank" style={{ color: cfg.color }}>
            {cfg.icon} {rankLabels[idx] || `#${idx + 1}`}
          </span>
          <span className="card-field"
            style={{ background: `${cfg.color}14`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
            {rec.field}
          </span>
        </div>
        <div className="card-row2">
          <span className="card-name">{rec.careerName}</span>
          <span className="card-score" style={{ color: sc }}>{rec.matchingScore}%</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill"
            style={{ width: `${rec.matchingScore}%`, background: `linear-gradient(90deg,${sc}70,${sc})` }} />
        </div>
      </div>

      <div className="card-why">{rec.whyThisCareer}</div>

      {/* Sub-score breakdown */}
      <div className="breakdown">
        {[
          { label: "SUBJECT",  pct: rec.subjectPct,  color: "#22d3ee" },
          { label: "INTEREST", pct: rec.interestPct, color: "#a78bfa" },
          { label: "SKILLS",   pct: rec.skillPct,    color: "#4ade80" },
        ].map(({ label, pct, color }) => (
          <div key={label} className="brow">
            <span className="blabel">{label}</span>
            <div className="btrack">
              <div className="bfill" style={{ width: `${pct}%`, background: color + "90" }} />
            </div>
            <span className="bval" style={{ color }}>{pct}%</span>
          </div>
        ))}
      </div>

      <div className="card-toggle" onClick={() => setOpen(o => !o)}>
        {open ? "HIDE" : "EDUCATION & SKILLS"}
        <span className={`chev ${open ? "open" : ""}`}>↓</span>
      </div>

      {open && (
        <div className="card-detail">
          <div>
            <div className="detail-label">Key Skills Required</div>
            <div className="skill-pills">
              {rec.requiredKeySkills.map(s => <span key={s} className="skill-pill">{s}</span>)}
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

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [subjects,  setSubjects]  = useState(["Mathematics", "Computer Science"]);
  const [interests, setInterests] = useState({
    [DIMS.CODE]: 4, [DIMS.AI]: 3, [DIMS.DATA]: 2,
    [DIMS.PHYS]: 3, [DIMS.BIO]: 2, [DIMS.CHEM]: 2,
    [DIMS.ELEC]: 2, [DIMS.RESEARCH]: 2,
  });
  const [skills,   setSkills]   = useState({
    "Programming": 4, "Problem Solving": 4,
    "Logical Thinking": 4, "Math Aptitude": 3, "Communication": 3,
  });
  const [env,      setEnv]      = useState("Office/Tech");
  const [goals,    setGoals]    = useState(["High Salary", "Innovation"]);
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const timerRef   = useRef(null);
  const resultsRef = useRef(null);
  const firstRun   = useRef(true);

  const buildProfile = () => ({
    favoriteSubjects: subjects,
    interestAreas: interests,
    skills,
    preferredWorkEnvironment: env,
    careerGoals: goals,
  });

  // Live update after first manual run (400 ms debounce)
  useEffect(() => {
    if (firstRun.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setRecs(recommendCareers(buildProfile(), 5));
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [subjects, interests, skills, env, goals]); // eslint-disable-line

  const handleAnalyse = () => {
    clearTimeout(timerRef.current);
    firstRun.current = false;
    setLoading(true); setDone(false);
    setTimeout(() => {
      setRecs(recommendCareers(buildProfile(), 5));
      setLoading(false); setDone(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 700);
  };

  const toggle = (arr, setArr, val) =>
    setArr(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);

  return (
    <div className="app">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">Career<span>.</span>Match<span>.</span>Studio</div>
        <div className="live-badge">
          <span className="live-dot" />
          LIVE UPDATES ON
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div>
          <div className="eyebrow">Career Guidance Engine</div>
          <h1 className="title">Find your <em>ideal</em><br />career path</h1>
        </div>
        <p className="hero-desc">
          Adjust your subjects, interests and skills — results update instantly.
          The engine uses cosine-similarity matching across 19 careers
          and returns a ranked shortlist with sub-score breakdowns.
        </p>
      </div>

      {/* LEGEND */}
      <div className="legend">
        {Object.entries(FIELD_CFG).map(([k, v]) => (
          <div key={k} className="leg-item">
            <div className="leg-dot" style={{ background: v.color }} />{k}
          </div>
        ))}
        <div className="leg-item" style={{ marginLeft: "auto" }}>
          <div className="leg-dot" style={{ background: "#22d3ee" }} />Subject
          <div className="leg-dot" style={{ background: "#a78bfa", marginLeft: 10 }} />Interest
          <div className="leg-dot" style={{ background: "#4ade80", marginLeft: 10 }} />Skills
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
                {SUBJECTS.map(s => (
                  <button key={s} className={`chip ${subjects.includes(s) ? "chip-subj" : ""}`}
                    onClick={() => toggle(subjects, setSubjects, s)}>{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Interest Areas (1–5)</div>
              {ALL_DIMS.map(d => (
                <Slider key={d} label={d} value={interests[d] ?? 1}
                  onChange={v => setInterests(p => ({ ...p, [d]: v }))} />
              ))}
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Skills (1–5)</div>
              {SKILL_DIMS.map(d => (
                <Slider key={d} label={d} value={skills[d] ?? 1}
                  onChange={v => setSkills(p => ({ ...p, [d]: v }))} />
              ))}
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Preferred Work Environment</div>
              <div className="chips">
                {WORK_ENVS.map(e => (
                  <button key={e} className={`chip ${env === e ? "chip-env" : ""}`}
                    onClick={() => setEnv(e)}>{e}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div className="section">
              <div className="sec-label">Career Goals</div>
              <div className="chips">
                {GOAL_OPTS.map(g => (
                  <button key={g} className={`chip ${goals.includes(g) ? "chip-goal" : ""}`}
                    onClick={() => toggle(goals, setGoals, g)}>{g}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" />

            <button className="submit-btn" onClick={handleAnalyse} disabled={loading}>
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
              {done && recs.length > 0 && (
                <div className="count-badge">{recs.length} careers ranked</div>
              )}
            </div>
          </div>

          {loading && (
            <div className="skels">
              {[130, 115, 115, 110, 110].map((h, i) => (
                <div key={i} className="skel"
                  style={{ height: h, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {!loading && !done && (
            <div className="empty">
              <div className="empty-glyph">[ _ ]</div>
              <p className="empty-text">
                Fill in your profile on the left, then click <strong>Analyse My Profile</strong>.
                Results also update live as you adjust sliders after the first run.
              </p>
            </div>
          )}

          {!loading && done && recs.length === 0 && (
            <div className="empty">
              <div className="empty-glyph">◌</div>
              <p className="empty-text">No results. Try selecting more subjects or raising interest sliders.</p>
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
