import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { getRecommendationHistory } from "../firebase/firestoreService";
import "../App.css";

const FIELD_COLORS = {
  "CS & IT": "#22d3ee",
  Engineering: "#f59e0b",
  Medical: "#4ade80",
};

function scoreColor(s) {
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#22d3ee";
  if (s >= 40) return "#f59e0b";
  return "#f87171";
}

function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";
  // Firestore Timestamp objects have .toDate(), plain strings don't
  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── History Item ───────────────────────────────────────────────────────────── */
function HistoryItem({ item, index }) {
  const [expanded, setExpanded] = useState(false);

  const topCareers = (item.recommendations || []).slice(0, 3);
  const allCareers = item.recommendations || [];

  return (
    <div
      className="history-item"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="history-dot" />
      <div
        className={`history-card ${expanded ? "history-card--expanded" : ""}`}
        onClick={() => setExpanded((o) => !o)}
      >
        <div className="history-date">{formatDate(item.createdAt)}</div>

        <div className="history-summary">
          {topCareers.map((rec) => (
            <span key={rec.careerName} className="history-career-pill">
              {rec.careerName}{" "}
              <span style={{ opacity: 0.7 }}>
                {rec.matchingScore || rec.score_percent || ""}%
              </span>
            </span>
          ))}
          {allCareers.length > 3 && (
            <span
              className="history-career-pill"
              style={{
                background: "rgba(255,255,255,.03)",
                borderColor: "rgba(255,255,255,.08)",
                color: "#6b7a96",
              }}
            >
              +{allCareers.length - 3} more
            </span>
          )}
        </div>

        {expanded && (
          <div className="history-detail">
            {/* Profile snapshot */}
            {item.profile && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: ".62rem",
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                    color: "#4a5468",
                    marginBottom: 8,
                  }}
                >
                  Profile Snapshot
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 4,
                  }}
                >
                  {(item.profile.favoriteSubjects || []).map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: ".7rem",
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "rgba(34,211,238,.06)",
                        border: "1px solid rgba(34,211,238,.15)",
                        color: "#22d3ee",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                {item.profile.preferredWorkEnvironment && (
                  <span
                    style={{
                      fontSize: ".72rem",
                      color: "#6b7a96",
                    }}
                  >
                    Environment: {item.profile.preferredWorkEnvironment}
                  </span>
                )}
              </div>
            )}

            {/* Full career list */}
            {allCareers.map((rec, i) => (
              <div key={rec.careerName || i} className="history-detail-rec">
                <div>
                  <span className="history-detail-name">{rec.careerName}</span>
                  {rec.field && (
                    <span
                      style={{
                        fontSize: ".66rem",
                        marginLeft: 8,
                        padding: "1px 7px",
                        borderRadius: 3,
                        color: FIELD_COLORS[rec.field] || "#94a3b8",
                        background: `${FIELD_COLORS[rec.field] || "#94a3b8"}12`,
                        border: `1px solid ${FIELD_COLORS[rec.field] || "#94a3b8"}25`,
                      }}
                    >
                      {rec.field}
                    </span>
                  )}
                </div>
                <span
                  className="history-detail-score"
                  style={{
                    color: scoreColor(
                      rec.matchingScore || rec.score_percent || 0
                    ),
                  }}
                >
                  {rec.matchingScore || rec.score_percent || 0}%
                </span>
              </div>
            ))}

            {/* Why text for top match */}
            {allCareers[0]?.whyThisCareer && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: ".78rem",
                  color: "#6b7a96",
                  lineHeight: 1.6,
                  borderTop: "1px solid rgba(255,255,255,.05)",
                  paddingTop: 10,
                }}
              >
                <strong style={{ color: "#dde3ee" }}>
                  Why {allCareers[0].careerName}?
                </strong>{" "}
                {allCareers[0].whyThisCareer}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: ".6rem",
              color: "#4a5468",
              letterSpacing: ".06em",
              cursor: "pointer",
            }}
          >
            {expanded ? "COLLAPSE ↑" : "EXPAND ↓"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HISTORY PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function History() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getRecommendationHistory(currentUser.uid);
        if (!cancelled) setHistory(data);
      } catch (err) {
        console.warn("Failed to load history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  return (
    <div className="history-page">
      <div className="history-container">
        {/* Header */}
        <div className="history-header">
          <div
            className="eyebrow"
            style={{ marginBottom: 8 }}
          >
            Your Journey
          </div>
          <h1>Recommendation History</h1>
          <p>
            Track how your career matches evolve as your interests and skills
            develop over time.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="empty" style={{ paddingTop: 40 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p className="empty-text">Loading history…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && history.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">📊</div>
            <p className="history-empty-text">
              No recommendation history yet. Run your first career analysis to
              start tracking your journey.
            </p>
            <Link to="/dashboard" className="hero-btn-primary">
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Timeline */}
        {!loading && history.length > 0 && (
          <>
            <div
              style={{
                marginBottom: 20,
                fontSize: ".82rem",
                color: "#6b7a96",
              }}
            >
              {history.length} analysis session
              {history.length !== 1 ? "s" : ""} recorded
            </div>
            <div className="history-timeline">
              {history.map((item, idx) => (
                <HistoryItem key={item.id} item={item} index={idx} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
