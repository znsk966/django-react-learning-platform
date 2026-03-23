import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getModules } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import {
  BookOpen, Layers, TrendingUp, CheckCircle2, Award, LayoutGrid
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import "./Dashboard.css";

const COLORS = ["#0077cc", "#00cc77", "#cc7700", "#cc0077", "#7700cc", "#9900cc"];

export default function Dashboard() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const { completedLessonIds } = useProgress();

  useEffect(() => {
    document.title = "Dashboard | Learning Platform";
    setLoading(true);
    setError(null);
    getModules()
      .then(res => {
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
  const completedCount = user
    ? modules.reduce((sum, m) => sum + (m.lessons?.filter(l => completedLessonIds.has(l.id)).length ?? 0), 0)
    : 0;
  const completionPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const completedModules = user
    ? modules.filter(m => {
        const lessons = m.lessons ?? [];
        return lessons.length > 0 && lessons.every(l => completedLessonIds.has(l.id));
      }).length
    : 0;

  // Chart: lessons per module
  const lessonsPerModule = modules.map(m => ({
    name: m.title,
    count: m.lessons?.length ?? 0,
  }));

  // Chart: stacked completed vs remaining per module (for logged-in users)
  const progressPerModule = modules.map(m => {
    const total = m.lessons?.length ?? 0;
    const done = user
      ? (m.lessons?.filter(l => completedLessonIds.has(l.id)).length ?? 0)
      : 0;
    return { name: m.title, completed: done, remaining: total - done };
  });

  // Chart: lesson distribution
  const lessonDistribution = modules.map(m => ({
    name: m.title,
    value: m.lessons?.length ?? 0,
  }));

  // "Continue learning" — modules started but not finished
  const resumable = user
    ? modules
        .map(m => {
          const lessons = [...(m.lessons ?? [])].sort((a, b) => a.order - b.order);
          const done = lessons.filter(l => completedLessonIds.has(l.id)).length;
          const nextLesson = lessons.find(l => !completedLessonIds.has(l.id));
          return { module: m, done, total: lessons.length, nextLesson };
        })
        .filter(r => r.done > 0 && r.nextLesson)
    : [];

  return (
    <div className="page dashboard">
      <h1>Learning Dashboard</h1>

      {/* Quick actions */}
      {user && (
        <div className="quick-actions">
          <Link to="/" className="quick-action-card">
            <LayoutGrid size={20} />
            <span>Browse Modules</span>
          </Link>
          {resumable.length > 0 && (
            <Link
              to={`/lesson/${resumable[0].nextLesson.id}?module=${resumable[0].module.id}`}
              className="quick-action-card quick-action-card--primary"
            >
              <BookOpen size={20} />
              <span>Continue Learning</span>
            </Link>
          )}
          <Link to="/profile" className="quick-action-card">
            <Award size={20} />
            <span>Manage Subscription</span>
          </Link>
        </div>
      )}

      {/* Content stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon"><Layers size={24} /></div>
          <h3>Total Modules</h3>
          <p className="stat-value">{modules.length}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BookOpen size={24} /></div>
          <h3>Total Lessons</h3>
          <p className="stat-value">{totalLessons}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <h3>Average Lessons per Module</h3>
          <p className="stat-value">
            {modules.length > 0 ? (totalLessons / modules.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      {/* Progress stats — logged-in users only */}
      {user ? (
        <>
          <h2 className="section-title">
            Your Progress
            {user.profile?.is_pro && (
              <span className="badge badge--pro section-pro-badge">Pro</span>
            )}
          </h2>
          <div className="dashboard-stats">
            <div className="stat-card stat-card--green">
              <div className="stat-icon"><CheckCircle2 size={24} /></div>
              <h3>Lessons Completed</h3>
              <p className="stat-value">{completedCount}</p>
            </div>
            <div className="stat-card stat-card--green">
              <div className="stat-icon"><TrendingUp size={24} /></div>
              <h3>Overall Completion</h3>
              <p className="stat-value">{completionPct}%</p>
            </div>
            <div className="stat-card stat-card--green">
              <div className="stat-icon"><Award size={24} /></div>
              <h3>Modules Finished</h3>
              <p className="stat-value">{completedModules}</p>
            </div>
          </div>

          {/* Continue learning */}
          {resumable.length > 0 && (
            <section className="chart-section continue-section">
              <h2>Continue Learning</h2>
              <div className="continue-grid">
                {resumable.map(({ module, done, total, nextLesson }) => (
                  <Link
                    key={module.id}
                    to={`/lesson/${nextLesson.id}?module=${module.id}`}
                    className="continue-card"
                  >
                    <div className="continue-card__module">{module.title}</div>
                    <div className="continue-card__lesson">Next: {nextLesson.title}</div>
                    <div className="progress-bar continue-card__bar">
                      <div
                        className="progress-bar__fill"
                        style={{ width: `${Math.round((done / total) * 100)}%` }}
                      />
                    </div>
                    <div className="continue-card__fraction">{done}/{total} completed</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="dashboard-signin-prompt">
          <p>Sign in to track your progress across all lessons.</p>
          <Link to="/login" className="back-link">Sign In →</Link>
        </div>
      )}

      {modules.length > 0 && (
        <>
          {user && (
            <section className="chart-section">
              <h2>Progress per Module</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressPerModule}>
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#00aa55" stackId="a" name="Completed" />
                  <Bar dataKey="remaining" fill="#e0e0e0" stackId="a" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
