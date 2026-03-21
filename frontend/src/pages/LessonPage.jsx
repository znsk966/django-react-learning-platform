import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getLessonById, getModuleById } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useProgress } from "../context/ProgressContext";
import { useToast } from "../context/ToastContext";
import MarkdownRenderer from "../components/MarkdownRenderer";

export default function LessonPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("module");

  const [lesson, setLesson] = useState(null);
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  const { user } = useAuth();
  const { completedLessonIds, markComplete, markIncomplete } = useProgress();
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setLesson(null);
    setModuleData(null);

    getLessonById(id)
      .then(res => {
        const lessonData = res.data;
        setLesson(lessonData);
        document.title = `${lessonData.title} | Learning Platform`;
        // Fetch module for breadcrumb + prev/next (non-critical — failure is silent)
        return getModuleById(lessonData.module).catch(() => null);
      })
      .then(res => {
        if (res) setModuleData(res.data);
        setLoading(false);
      })
      .catch(err => {
        document.title = "Lesson | Learning Platform";
        setError(err.userMessage || "Failed to load lesson");
        setLoading(false);
      });
  }, [id]);

  const isCompleted = lesson ? completedLessonIds?.has(lesson.id) : false;

  const handleToggleComplete = useCallback(async () => {
    if (!lesson || completing) return;
    setCompleting(true);
    try {
      if (isCompleted) {
        await markIncomplete(lesson.id);
        showToast("Marked as incomplete", "info");
      } else {
        await markComplete(lesson.id);
        showToast("Lesson completed! ✓", "success");
      }
    } catch {
      showToast("Failed to update progress", "error");
    } finally {
      setCompleting(false);
    }
  }, [lesson, completing, isCompleted, markComplete, markIncomplete, showToast]);

  // Prev / next using the module's sorted lesson list
  const sortedLessons = moduleData?.lessons
    ? [...moduleData.lessons].sort((a, b) => a.order - b.order)
    : [];
  const currentIdx = sortedLessons.findIndex(l => l.id === Number(id));
  const prevLesson = currentIdx > 0 ? sortedLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < sortedLessons.length - 1 ? sortedLessons[currentIdx + 1] : null;
  const moduleLink = moduleData?.id ?? moduleId;
  const allModuleLessonsComplete =
    moduleData && sortedLessons.length > 0 && sortedLessons.every(l => completedLessonIds?.has(l.id));

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading lesson...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="page">
        <div className="error">Error: {error || "Lesson not found"}</div>
        {moduleId && (
          <Link to={`/modules/${moduleId}`} className="back-link">← Back to Module</Link>
        )}
        <Link to="/" className="back-link">← Back to All Modules</Link>
      </div>
    );
  }

  return (
    <div className="page lesson-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="breadcrumb">
        <Link to="/">Modules</Link>
        <span className="breadcrumb-sep">›</span>
        {moduleData
          ? <Link to={`/modules/${moduleData.id}`}>{moduleData.title}</Link>
          : moduleId
            ? <Link to={`/modules/${moduleId}`}>Module</Link>
            : null
        }
        {(moduleData || moduleId) && <span className="breadcrumb-sep">›</span>}
        <span className="breadcrumb-current">{lesson.title}</span>
      </nav>

      {/* Header */}
      <div className="lesson-header">
        <h1>
          {isCompleted && <span className="lesson-completed-check" aria-hidden="true">✓ </span>}
          {lesson.title}
        </h1>
        {user && (
          <button
            className={`btn-complete${isCompleted ? " btn-complete--done" : ""}`}
            onClick={handleToggleComplete}
            disabled={completing}
          >
            {completing ? "Saving…" : isCompleted ? "✓ Completed" : "Mark as complete"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="lesson-content">
        <MarkdownRenderer content={lesson.content_md} />
      </div>

      {/* Module completion banner */}
      {allModuleLessonsComplete && (
        <div className="completion-banner">
          🎉 You've completed all lessons in <strong>{moduleData.title}</strong>!{" "}
          <Link to="/" className="completion-banner__link">Browse more modules →</Link>
        </div>
      )}

      {/* Prev / next navigation */}
      <div className="lesson-navigation">
        <div className="lesson-nav-side">
          {prevLesson && (
            <Link to={`/lesson/${prevLesson.id}?module=${moduleLink}`} className="back-link">
              ← {prevLesson.title}
            </Link>
          )}
        </div>
        <div className="lesson-nav-center">
          {moduleLink && (
            <Link to={`/modules/${moduleLink}`} className="back-link">↑ Back to Module</Link>
          )}
        </div>
        <div className="lesson-nav-side lesson-nav-side--right">
          {nextLesson && (
            <Link to={`/lesson/${nextLesson.id}?module=${moduleLink}`} className="back-link">
              {nextLesson.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
