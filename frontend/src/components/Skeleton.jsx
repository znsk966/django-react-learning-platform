import "./Skeleton.css";

export function SkeletonModuleCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-text" />
      <div className="skeleton-line skeleton-text skeleton-text--short" />
      <div className="skeleton-line skeleton-meta" />
    </div>
  );
}

export function SkeletonLessonCard() {
  return (
    <div className="skeleton-lesson" aria-hidden="true">
      <div className="skeleton-circle" />
      <div className="skeleton-line skeleton-lesson-title" />
    </div>
  );
}
