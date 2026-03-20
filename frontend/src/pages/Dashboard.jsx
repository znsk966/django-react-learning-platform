import { useEffect, useState } from "react";
import { getModules } from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import "./Dashboard.css";

export default function Dashboard() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Dashboard | Learning Platform";
    setLoading(true);
    setError(null);
    getModules()
      .then((res) => {
        setModules(res.data.results);
        setLoading(false);
      })
      .catch(err => {
        setError(err.userMessage || "Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page dashboard">
        <h1>Learning Dashboard</h1>
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page dashboard">
        <h1>Learning Dashboard</h1>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  // Data: lessons per module
  const lessonsPerModule = modules.map(m => ({
    name: m.title,
    count: m.lessons?.length ?? 0,
  }));

  // Data: share of lessons per module (content distribution)
  const lessonDistribution = modules.map((m) => ({
    name: m.title,
    value: m.lessons?.length ?? 0,
  }));

  const colors = ["#0077cc", "#00cc77", "#cc7700", "#cc0077", "#7700cc", "#9900cc"];

  return (
    <div className="page dashboard">
      <h1>Learning Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Modules</h3>
          <p className="stat-value">{modules.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Lessons</h3>
          <p className="stat-value">{totalLessons}</p>
        </div>
        <div className="stat-card">
          <h3>Average Lessons per Module</h3>
          <p className="stat-value">
            {modules.length > 0
              ? (totalLessons / modules.length).toFixed(1)
              : 0}
          </p>
        </div>
      </div>

      {modules.length > 0 && (
        <>
          <section className="chart-section">
            <h2>Lessons per Module</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lessonsPerModule}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0077cc" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="chart-section">
            <h2>Lesson Distribution by Module</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={lessonDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {lessonDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>
        </>
      )}

      {modules.length === 0 && (
        <div className="empty-state">No data available to display.</div>
      )}
    </div>
  );
}