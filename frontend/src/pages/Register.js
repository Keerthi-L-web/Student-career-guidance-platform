import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { saveUserProfile } from "../firebase/firestoreService";
import "../App.css";

export default function Register() {
  const nameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { currentUser, signup, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match.");
    }

    try {
      setError("");
      setLoading(true);
      const { user } = await signup(
        emailRef.current.value,
        passwordRef.current.value
      );

      // Navigate immediately — don't wait for Firestore
      navigate("/dashboard");

      // Save profile in background (non-blocking)
      saveUserProfile(user.uid, {
        displayName: nameRef.current.value || "",
        email: user.email,
        educationLevel: "",
        createdAt: new Date().toISOString(),
      }).catch((err) => console.warn("Profile save deferred:", err.message));
    } catch (err) {
      console.error("Registration error:", err.code, err.message);
      setLoading(false);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError(
          "Email/Password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method."
        );
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else if (
        err.code === "auth/invalid-api-key" ||
        err.code === "auth/api-key-not-valid.-please-pass-a-valid-api-key."
      ) {
        setError("Invalid Firebase API key. Check your .env file.");
      } else {
        setError(`Registration failed: ${err.code || err.message}`);
      }
    }
  }

  async function handleGoogleSignup() {
    try {
      setError("");
      setLoading(true);
      const { user } = await loginWithGoogle();

      // Navigate immediately
      navigate("/dashboard");

      // Save profile in background (non-blocking)
      saveUserProfile(user.uid, {
        displayName: user.displayName || "",
        email: user.email,
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
      }).catch((err) => console.warn("Profile save deferred:", err.message));
    } catch (err) {
      console.error("Google signup error:", err.code, err.message);
      setLoading(false);
      setError(`Google sign-up failed: ${err.code || err.message}`);
    }
  }

  // Don't render the form if already logged in
  if (currentUser) return null;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-card-title">Create account</h2>
        <p className="auth-card-subtitle">
          Start your career discovery journey today
        </p>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              ref={nameRef}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              ref={emailRef}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              ref={passwordRef}
              required
              placeholder="Min 6 characters"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm">Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              ref={passwordConfirmRef}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            disabled={loading}
            className="submit-btn"
            type="submit"
            id="register-submit"
          >
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="google-btn"
            type="button"
            id="google-register"
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
