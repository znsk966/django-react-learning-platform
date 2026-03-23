import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

export default function NavBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);
  const initials = user ? user.username.slice(0, 2).toUpperCase() : "";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" onClick={close}>📚 LearnHub</Link>
      </div>

      <button
        className="navbar-hamburger"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <ul className={`navbar-links${menuOpen ? " navbar-links--open" : ""}`}>
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""} onClick={close}>
            Modules
          </NavLink>
        </li>
        {user && (
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""} onClick={close}>
              Dashboard
            </NavLink>
          </li>
        )}
        {user ? (
          <>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) => `navbar-user${isActive ? ' active' : ''}`}
                onClick={close}
              >
                <span className="navbar-avatar" aria-hidden="true">{initials}</span>
                <span className="navbar-username">{user.username}</span>
                {user.profile?.is_pro && (
                  <span className="badge badge--pro badge--xs">Pro</span>
                )}
              </NavLink>
            </li>
            <li>
              <button className="navbar-logout" onClick={() => { logout(); close(); }}>
                Sign Out
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""} onClick={close}>
                Sign In
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/register"
                className={({ isActive }) => isActive ? "active navbar-register" : "navbar-register"}
                onClick={close}
              >
                Register
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
