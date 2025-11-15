import { Link } from "react-router-dom";
import "./Card.css";

export default function ModuleCard({ module }) {
  const lessonCount = module.lessons ? module.lessons.length : 0;
  
  return (
    <Link to={`/modules/${module.id}`} className="card module-card">
      <h2>{module.title}</h2>
      {module.description && <p className="module-description">{module.description}</p>}
      {lessonCount > 0 && (
        <div className="module-meta">
          <span className="lesson-count">{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
        </div>
      )}
    </Link>
  );
}