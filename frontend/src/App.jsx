import NavBar from "./components/NavBar";
import { Routes, Route } from "react-router-dom";
import ModulesPage from "./pages/ModulesPage";
import ModuleDetail from "./pages/ModuleDetail";
import LessonPage from "./pages/LessonPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <Routes>
        <Route path="/" element={<ModulesPage />} />
        <Route path="/modules/:id" element={<ModuleDetail />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}