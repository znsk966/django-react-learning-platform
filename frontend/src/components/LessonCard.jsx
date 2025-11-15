import { Link } from "react-router-dom";
import "./Card.css";

export default function LessonCard({ lesson, moduleId }) {
  const lessonUrl = `/lesson/${lesson.id}${moduleId ? `?module=${moduleId}` : ''}`;
  
  return (
    <Link to={lessonUrl} className="card lesson-card">
      <div className="lesson-card-content">
        <span className="lesson-order">{lesson.order}</span>
        <strong className="lesson-title">{lesson.title}</strong>
      </div>
    </Link>
  );
}