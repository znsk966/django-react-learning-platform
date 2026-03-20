import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavBar.css";

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">📚 LearnHub</Link>
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            Modules
          </NavLink>
        </li>
        {user ? (
          <>
            <li className="navbar-username">
              {user.username}
            </li>
            <li>
              <button className="navbar-logout" onClick={logout}>
                Sign Out
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/login" className={({ isActive }) => isActive ? "active" : ""}>
                Sign In
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className={({ isActive }) => isActive ? "active navbar-register" : "navbar-register"}>
                Register
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
