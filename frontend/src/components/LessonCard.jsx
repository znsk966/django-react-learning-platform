import { Link } from "react-router-dom";
import "./Card.css";

function readTime(contentMd) {
  const words = (contentMd || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function LessonCard({ lesson, moduleId, completed }) {
  const lessonUrl = `/lesson/${lesson.id}${moduleId ? `?module=${moduleId}` : ""}`;
  const mins = readTime(lesson.content_md);

  return (
    <Link to={lessonUrl} className={`card lesson-card${completed ? " lesson-card--completed" : ""}`}>
      <div className="lesson-card-content">
        <span className={`lesson-order${completed ? " lesson-order--completed" : ""}`}>
          {completed ? "✓" : lesson.order}
        </span>
        <strong className="lesson-title">{lesson.title}</strong>
        <div className="lesson-meta">
          <span className="read-time">{mins} min read</span>
          {completed && <span className="completed-badge">Completed</span>}
        </div>
      </div>
    </Link>
  );
}
