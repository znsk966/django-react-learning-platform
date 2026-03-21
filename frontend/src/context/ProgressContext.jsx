import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getProgress, markLessonComplete, markLessonIncomplete } from "../api/client";

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const { user, authLoading } = useAuth();
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [progressLoading, setProgressLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCompletedLessonIds(new Set());
      return;
    }

    setProgressLoading(true);

    const fetchAll = async () => {
      let page = 1;
      const ids = [];
      while (true) {
        const res = await getProgress({ page });
        res.data.results.forEach(p => ids.push(p.lesson));
        if (!res.data.next) break;
        page++;
      }
      return ids;
    };

    fetchAll()
      .then(ids => setCompletedLessonIds(new Set(ids)))
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, [user, authLoading]);

  const markComplete = useCallback(async (lessonId) => {
    await markLessonComplete(lessonId);
    setCompletedLessonIds(prev => new Set([...prev, lessonId]));
  }, []);

  const markIncomplete = useCallback(async (lessonId) => {
    await markLessonIncomplete(lessonId);
    setCompletedLessonIds(prev => {
      const next = new Set(prev);
      next.delete(lessonId);
      return next;
    });
  }, []);

  return (
    <ProgressContext.Provider value={{ completedLessonIds, progressLoading, markComplete, markIncomplete }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
