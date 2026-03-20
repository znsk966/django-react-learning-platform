import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getLessonById } from "../api/client";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function LessonPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("module");

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLessonById(id)
      .then(res => {
        setLesson(res.data);
        document.title = `${res.data.title} | Learning Platform`;
        setLoading(false);
      })
      .catch(err => {
        document.title = "Lesson | Learning Platform";
        setError(err.userMessage || "Failed to load lesson");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading lesson...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error">Error: {error}</div>
        {moduleId && (
          <Link to={`/modules/${moduleId}`} className="back-link">
            ← Back to Module
          </Link>
        )}
        <Link to="/" className="back-link">← Back to All Modules</Link>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="page">
        <div className="error">Lesson not found</div>
        {moduleId && (
          <Link to={`/modules/${moduleId}`} className="back-link">
            ← Back to Module
          </Link>
        )}
        <Link to="/" className="back-link">← Back to All Modules</Link>
      </div>
    );
  }

  return (
    <div className="page lesson-page">
      <h1>{lesson.title}</h1>
      <div className="lesson-content">
        <MarkdownRenderer content={lesson.content_md} />
      </div>
      <div className="lesson-navigation">
        {moduleId && (
          <Link to={`/modules/${moduleId}`} className="back-link">
            ← Back to Module
          </Link>
        )}
        <Link to="/" className="back-link">← Back to All Modules</Link>
      </div>
    </div>
  );
}

