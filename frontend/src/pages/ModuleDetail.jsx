import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getModuleById } from "../api/client";
import { useProgress } from "../context/ProgressContext";
import LessonCard from "../components/LessonCard";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { SkeletonLessonCard } from "../components/Skeleton";

function formatDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function ModuleDetail() {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { completedLessonIds } = useProgress();

  useEffect(() => {
    setLoading(true);
    setError(null);
    getModuleById(id)
      .then(res => {
        setModule(res.data);
        document.title = `${res.data.title} | Learning Platform`;
        setLoading(false);
      })
      .catch(err => {
        document.title = "Module | Learning Platform";
        setError(err.userMessage || "Failed to load module");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-line skeleton-title" style={{ width: "40%", height: "2rem", background: "#e0e0e0", borderRadius: 4, marginBottom: "1.5rem" }} />
        <div className="list">
          {[1, 2, 3].map(i => <SkeletonLessonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">Error: {error}</div>
        <Link to="/" className="back-link">← Back to Modules</Link>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="page">
        <div className="error">Module not found</div>
        <Link to="/" className="back-link">← Back to Modules</Link>
      </div>
    );
  }

  const lessons    = module.lessons ?? [];
  const total      = lessons.length;
  const completed  = completedLessonIds
    ? lessons.filter(l => completedLessonIds.has(l.id)).length
    : 0;
  const pct        = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allComplete = total > 0 && completed === total;
  const duration   = formatDuration(module.estimated_duration);
  const authorName = module.author
    ? (module.author.full_name || module.author.username)
    : null;

  return (
    <div className="page">
      {module.thumbnail_url && (
        <img src={module.thumbnail_url} alt={module.title} className="module-detail-thumbnail" />
      )}

      <h1>{module.title}</h1>

      {/* Meta row: difficulty, duration, author */}
      <div className="module-detail-meta">
        {module.difficulty && (
          <span className={`badge badge--${module.difficulty}`}>{module.difficulty}</span>
        )}
        {duration && (
          <span className="module-detail-meta-item">⏱ {duration}</span>
        )}
        {total > 0 && (
          <span className="module-detail-meta-item">📖 {total} {total === 1 ? "lesson" : "lessons"}</span>
        )}
        {authorName && (
          <span className="module-detail-meta-item">👤 {authorName}</span>
        )}
      </div>

      {/* Tags */}
      {module.tags?.length > 0 && (
        <div className="module-tags" style={{ marginBottom: "1rem" }}>
          {module.tags.map(tag => (
            <span key={tag.id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}

      {module.description && <p className="module-description">{module.description}</p>}

      {/* Learning objectives */}
      {module.learning_objectives && (
        <div className="learning-objectives">
          <h2>What you'll learn</h2>
          <MarkdownRenderer content={module.learning_objectives} />
        </div>
      )}

      {/* Progress bar */}
      {completedLessonIds && total > 0 && (
        <div className="module-progress-section">
          <div className="module-progress-header">
            <span>{completed} of {total} lessons completed</span>
            <span className="module-progress-pct">{pct}%</span>
          </div>
          <div className="progress-bar progress-bar--large">
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
          {allComplete && (
            <div className="completion-banner">
              🎉 Module complete! Every lesson is done.{" "}
              <Link to="/" className="completion-banner__link">Browse more modules →</Link>
            </div>
          )}
        </div>
      )}

      {total > 0 ? (
        <div className="list">
          {lessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              moduleId={module.id}
              completed={completedLessonIds?.has(lesson.id)}
            />
          ))}
        </div>
      ) : (
        <p className="no-lessons">No lessons available in this module.</p>
      )}

      <Link to="/" className="back-link">← Back to Modules</Link>
    </div>
  );
}
