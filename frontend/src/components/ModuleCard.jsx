import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import "./Card.css";

function formatDuration(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function ModuleCardContent({ module, completedLessonIds }) {
  const lessons   = module.lessons ?? [];
  const total     = lessons.length;
  const completed = completedLessonIds
    ? lessons.filter(l => completedLessonIds.has(l.id)).length
    : 0;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
  const duration  = formatDuration(module.estimated_duration);
  const authorName = module.author
    ? (module.author.full_name || module.author.username)
    : null;

  return (
    <>
      {module.thumbnail_url && (
        <img src={module.thumbnail_url} alt={module.title} className="module-thumbnail" />
      )}

      <div className="module-card-badges">
        {module.difficulty && (
          <span className={`badge badge--${module.difficulty}`}>{module.difficulty}</span>
        )}
        {module.is_locked && (
          <span className="badge badge--pro">
            <Lock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
            Pro
          </span>
        )}
        {duration && <span className="badge badge--neutral">⏱ {duration}</span>}
      </div>

      <h2>{module.title}</h2>

      {module.description && <p className="module-description">{module.description}</p>}

      {module.tags?.length > 0 && (
        <div className="module-tags">
          {module.tags.map(tag => (
            <span key={tag.id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="module-meta">
          <div className="module-meta-row">
            <span className="lesson-count">{total} {total === 1 ? "lesson" : "lessons"}</span>
            {completedLessonIds && !module.is_locked && (
              <span className="progress-fraction">{completed}/{total} completed</span>
            )}
          </div>
          {completedLessonIds && !module.is_locked && (
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      {authorName && (
        <div className="module-author">By {authorName}</div>
      )}
    </>
  );
}

export default function ModuleCard({ module, completedLessonIds }) {
  if (module.is_locked) {
    return (
      <div className="card module-card module-card--locked" title="Upgrade to Pro to access this module">
        <ModuleCardContent module={module} completedLessonIds={completedLessonIds} />
        <div className="module-lock-overlay">
          <Lock size={28} />
          <span>Pro content — <Link to="/profile" className="upgrade-link" onClick={e => e.stopPropagation()}>Upgrade to Pro</Link></span>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/modules/${module.id}`} className="card module-card">
      <ModuleCardContent module={module} completedLessonIds={completedLessonIds} />
    </Link>
  );
}
