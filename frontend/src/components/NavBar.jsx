import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
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
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
            Modules
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}