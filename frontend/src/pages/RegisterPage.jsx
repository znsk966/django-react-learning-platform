import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe, loginUser, registerUser } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Create Account | Learning Platform";
    if (user) navigate("/");
  }, [user, navigate]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await registerUser(form);
      // Auto-login after successful registration
      const tokenRes = await loginUser({ username: form.username, password: form.password });
      const { access, refresh } = tokenRes.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      const meRes = await getMe();
      login(access, refresh, meRes.data);
      navigate("/");
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      } else {
        setErrors({ non_field_errors: [err.userMessage || "Registration failed."] });
      }
    } finally {
      setLoading(false);
    }
  }

  function fieldError(field) {
    const msgs = errors[field];
    if (!msgs) return null;
    return <span className="field-error">{Array.isArray(msgs) ? msgs[0] : msgs}</span>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          {errors.non_field_errors && (
            <div className="error">{errors.non_field_errors[0]}</div>
          )}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            {fieldError("username")}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            {fieldError("email")}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {fieldError("password")}
          </div>
          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              id="password2"
              name="password2"
              type="password"
              value={form.password2}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {fieldError("password2")}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
