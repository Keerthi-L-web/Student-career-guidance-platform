import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getUserProfile,
  saveUserProfile,
  getStudentProfile,
} from "../firebase/firestoreService";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { deleteUser } from "firebase/auth";
import "../App.css";

const DIMS_SHORT = {
  "Coding / Software": "Coding",
  "AI & Machine Learning": "AI/ML",
  "Data & Analytics": "Data",
  "Physics & Maths": "Physics",
  Biology: "Bio",
  Chemistry: "Chem",
  "Electronics & HW": "Electronics",
  Research: "Research",
};

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  /* Load profiles (with 5s timeout) */
  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("Profile load timed out — showing defaults");
        setLoading(false);
      }
    }, 5000);

    (async () => {
      try {
        const [uProfile, sProfile] = await Promise.all([
          getUserProfile(currentUser.uid),
          getStudentProfile(currentUser.uid),
        ]);
        if (cancelled) return;
        setUserProfile(uProfile);
        setStudentProfile(sProfile);
        if (uProfile) {
          setDisplayName(uProfile.displayName || "");
          setEducationLevel(uProfile.educationLevel || "");
        }
      } catch (err) {
        console.warn("Failed to load profile:", err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [currentUser]);

  /* Save profile */
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveUserProfile(currentUser.uid, {
        displayName,
        educationLevel,
        email: currentUser.email,
      });
      showToast("Profile saved successfully ✓");
    } catch (err) {
      console.error(err);
      showToast("Failed to save profile", "error");
    }
    setSaving(false);
  };

  /* Delete account */
  const handleDelete = async () => {
    try {
      await deleteUser(currentUser);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        showToast("Please logout, login again, and retry.", "error");
      } else {
        showToast("Failed to delete account.", "error");
      }
    }
  };

  /* Build chart data */
  const radarData = studentProfile
    ? Object.entries(studentProfile.interestAreas || {}).map(([key, val]) => ({
        dim: DIMS_SHORT[key] || key,
        value: val,
      }))
    : [];

  const skillsData = studentProfile
    ? Object.entries(studentProfile.skills || {}).map(([key, val]) => ({
        skill: key,
        value: val,
      }))
    : [];

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="empty" style={{ paddingTop: 80 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
            <p className="empty-text">Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {toast && (
        <div className={`toast ${toastType === "error" ? "toast--error" : ""}`}>
          {toast}
        </div>
      )}

      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-lg">
            {(displayName || currentUser?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{displayName || "Student"}</h1>
            <p>{currentUser?.email}</p>
            {userProfile?.createdAt && (
              <p style={{ fontSize: ".75rem", color: "#4a5468", marginTop: 2 }}>
                Member since{" "}
                {new Date(userProfile.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="profile-grid">
          {/* ── Edit Profile Card ── */}
          <div className="profile-card" style={{ animationDelay: "0s" }}>
            <div className="profile-card-title">Personal Information</div>
            <div className="profile-form-group">
              <label>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="profile-form-group">
              <label>Email</label>
              <input type="email" value={currentUser?.email || ""} disabled />
            </div>
            <div className="profile-form-group">
              <label>Education Level</label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="">Select…</option>
                <option value="10th">10th Grade</option>
                <option value="12th">12th Grade</option>
                <option value="ug">Undergraduate</option>
                <option value="pg">Postgraduate</option>
                <option value="working">Working Professional</option>
              </select>
            </div>
            <button
              className="profile-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* ── Quick Stats ── */}
          <div className="profile-card" style={{ animationDelay: ".1s" }}>
            <div className="profile-card-title">Quick Stats</div>
            <div className="profile-stat">
              <span className="profile-stat-label">Subjects</span>
              <span className="profile-stat-value">
                {studentProfile?.favoriteSubjects?.join(", ") || "Not set"}
              </span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Work Env</span>
              <span className="profile-stat-value">
                {studentProfile?.preferredWorkEnvironment || "Not set"}
              </span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Goals</span>
              <span className="profile-stat-value">
                {studentProfile?.careerGoals?.join(", ") || "Not set"}
              </span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Education</span>
              <span className="profile-stat-value">
                {educationLevel || "Not set"}
              </span>
            </div>
          </div>

          {/* ── Interest Radar ── */}
          <div className="profile-card" style={{ animationDelay: ".2s" }}>
            <div className="profile-card-title">Interest Profile</div>
            {radarData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="68%">
                    <PolarGrid stroke="rgba(255,255,255,.07)" />
                    <PolarAngleAxis
                      dataKey="dim"
                      tick={{ fill: "#6b7a96", fontSize: 10 }}
                    />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="#a78bfa"
                      fill="#a78bfa"
                      fillOpacity={0.2}
                      strokeWidth={2}
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
            ) : (
              <div className="empty" style={{ padding: "40px 20px" }}>
                <p className="empty-text">
                  Run your first analysis on the Dashboard to see your interest
                  profile here.
                </p>
              </div>
            )}
          </div>

          {/* ── Skills Bar Chart ── */}
          <div className="profile-card" style={{ animationDelay: ".3s" }}>
            <div className="profile-card-title">Skill Levels</div>
            {skillsData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsData} layout="vertical" barSize={14}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,.05)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 5]}
                      tick={{ fill: "#6b7a96", fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="skill"
                      tick={{ fill: "#6b7a96", fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0c0f18",
                        border: "1px solid rgba(255,255,255,.1)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty" style={{ padding: "40px 20px" }}>
                <p className="empty-text">
                  Run your first analysis to see your skill chart here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="profile-danger-zone">
          <div className="profile-danger-title">Danger Zone</div>
          <p className="profile-danger-text">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              className="profile-delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: ".82rem", color: "#f87171" }}>
                Are you sure?
              </span>
              <button
                className="profile-delete-btn"
                onClick={handleDelete}
                style={{ background: "rgba(248,113,113,.15)" }}
              >
                Yes, Delete
              </button>
              <button
                className="profile-delete-btn"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ color: "#6b7a96", borderColor: "rgba(255,255,255,.1)" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
