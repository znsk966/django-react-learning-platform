import { useEffect, useState } from "react";
import { getModules } from "../api/client";
import ModuleCard from "../components/ModuleCard";

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Learning Modules | Learning Platform";
    setLoading(true);
    setError(null);
    getModules()
      .then(res => {
        setModules(res.data.results);
        setLoading(false);
      })
      .catch(err => {
        setError(err.userMessage || "Failed to load modules");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page">
        <h1>Learning Modules</h1>
        <div className="loading">Loading modules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h1>Learning Modules</h1>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Learning Modules</h1>
      {modules.length > 0 ? (
        <div className="grid">
          {modules.map(mod => (
            <ModuleCard key={mod.id} module={mod} />
          ))}
        </div>
      ) : (
        <div className="empty-state">No modules available.</div>
      )}
    </div>
  );
}
