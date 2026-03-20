import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getModuleById } from "../api/client";
import LessonCard from "../components/LessonCard";

export default function ModuleDetail() {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="loading">Loading module...</div>
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

  return (
    <div className="page">
      <h1>{module.title}</h1>
      {module.description && <p className="module-description">{module.description}</p>}
      {module.lessons && module.lessons.length > 0 ? (
        <div className="list">
          {module.lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} moduleId={module.id} />
          ))}
        </div>
      ) : (
        <p className="no-lessons">No lessons available in this module.</p>
      )}
      <Link to="/" className="back-link">← Back to Modules</Link>
    </div>
  );
}
