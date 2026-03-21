import { useEffect, useState } from "react";
import { getModules, getTags } from "../api/client";
import { useProgress } from "../context/ProgressContext";
import ModuleCard from "../components/ModuleCard";
import { SkeletonModuleCard } from "../components/Skeleton";

const DIFFICULTIES = [
  { value: "",             label: "All levels" },
  { value: "beginner",     label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced",     label: "Advanced" },
];

export default function ModulesPage() {
  const [modules, setModules]       = useState([]);
  const [tags, setTags]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const { completedLessonIds } = useProgress();

  // Fetch tags once on mount for the filter bar
  useEffect(() => {
    document.title = "Learning Modules | Learning Platform";
    getTags().then(res => setTags(res.data)).catch(() => {});
  }, []);

  // Refetch modules whenever filters change
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (difficulty)   params.difficulty = difficulty;
    if (selectedTag)  params.tag        = selectedTag;
    getModules(params)
      .then(res => {
        setModules(res.data.results);
        setLoading(false);
      })
      .catch(err => {
        setError(err.userMessage || "Failed to load modules");
        setLoading(false);
      });
  }, [difficulty, selectedTag]);

  const clearFilters = () => {
    setDifficulty("");
    setSelectedTag("");
  };

  const hasFilters = difficulty || selectedTag;

  return (
    <div className="page">
      <h1>Learning Modules</h1>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Level</span>
          <div className="filter-chips">
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                className={`filter-chip${difficulty === d.value ? " filter-chip--active" : ""}`}
                onClick={() => setDifficulty(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {tags.length > 0 && (
          <div className="filter-group">
            <span className="filter-label">Topic</span>
            <div className="filter-chips">
              <button
                className={`filter-chip${selectedTag === "" ? " filter-chip--active" : ""}`}
                onClick={() => setSelectedTag("")}
              >
                All topics
              </button>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  className={`filter-chip${selectedTag === tag.slug ? " filter-chip--active" : ""}`}
                  onClick={() => setSelectedTag(tag.slug)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasFilters && (
          <button className="filter-clear" onClick={clearFilters}>✕ Clear filters</button>
        )}
      </div>

      {loading ? (
        <div className="grid">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonModuleCard key={i} />)}
        </div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : modules.length > 0 ? (
        <div className="grid">
          {modules.map(mod => (
            <ModuleCard key={mod.id} module={mod} completedLessonIds={completedLessonIds} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          {hasFilters ? "No modules match your filters." : "No modules available."}
        </div>
      )}
    </div>
  );
}
