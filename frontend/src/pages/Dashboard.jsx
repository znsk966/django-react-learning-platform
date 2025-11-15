import { useEffect, useState } from "react";
import { getModules, getLessons } from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import "./Dashboard.css";

export default function Dashboard() {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getModules(), getLessons()])
      .then(([modulesRes, lessonsRes]) => {
        setModules(modulesRes.data);
        setLessons(lessonsRes.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.detail || "Failed to load dashboard data");
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

  // Data: lessons per module
  const lessonsPerModule = modules.map(m => ({
    name: m.title,
    count: m.lessons ? m.lessons.length : 0,
  }));

  // Data: module completion (demo percentages)
  const completionData = modules.map((m) => ({
    name: m.title,
    value: m.lessons ? Math.min(100, Math.floor((m.lessons.length / Math.max(lessons.length, 1)) * 100)) : 0,
  }));

  const colors = ["#0077cc", "#00cc77", "#cc7700", "#cc0077", "#7700cc", "#cc0077"];

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
          <p className="stat-value">{lessons.length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Lessons per Module</h3>
          <p className="stat-value">
            {modules.length > 0 
              ? (lessons.length / modules.length).toFixed(1) 
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
            <h2>Module Completion</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {completionData.map((entry, index) => (
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