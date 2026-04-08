import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      console.error("Failed to log out");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo-link">
          <span className="nav-logo-icon">◈</span>
          <span className="nav-logo-text">
            Career<span className="nav-logo-accent">.</span>Match
            <span className="nav-logo-accent">.</span>Studio
          </span>
        </Link>

        {/* Hamburger */}
        <button
          className={`nav-hamburger ${menuOpen ? "nav-hamburger--open" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Links */}
        <div className={`nav-menu ${menuOpen ? "nav-menu--open" : ""}`}>
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "nav-link--active" : ""}`}
          >
            Home
          </Link>

          {currentUser && (
            <>
              <Link
                to="/dashboard"
                className={`nav-link ${
                  isActive("/dashboard") ? "nav-link--active" : ""
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className={`nav-link ${
                  isActive("/profile") ? "nav-link--active" : ""
                }`}
              >
                Profile
              </Link>
              <Link
                to="/history"
                className={`nav-link ${
                  isActive("/history") ? "nav-link--active" : ""
                }`}
              >
                History
              </Link>
            </>
          )}

          {/* Auth area */}
          {currentUser ? (
            <div className="nav-user">
              <div className="nav-avatar">
                {currentUser.email?.charAt(0).toUpperCase()}
              </div>
              <span className="nav-email">{currentUser.email}</span>
              <button onClick={handleLogout} className="nav-logout-btn">
                Log Out
              </button>
            </div>
          ) : (
            <div className="nav-auth-links">
              <Link to="/login" className="nav-link nav-link--login">
                Log In
              </Link>
              <Link to="/register" className="nav-cta-btn">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}