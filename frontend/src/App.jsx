import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { ToastProvider } from "./context/ToastContext";
import NavBar from "./components/NavBar";
import ScrollToTop from "./components/ScrollToTop";
import ModulesPage from "./pages/ModulesPage";
import ModuleDetail from "./pages/ModuleDetail";
import LessonPage from "./pages/LessonPage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <ToastProvider>
          <ScrollToTop />
          <div className="app">
            <NavBar />
            <Routes>
              <Route path="/" element={<ModulesPage />} />
              <Route path="/modules/:id" element={<ModuleDetail />} />
              <Route path="/lesson/:id" element={<LessonPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="*" element={
                <div className="page">
                  <h1>404 — Page Not Found</h1>
                </div>
              } />
            </Routes>
          </div>
        </ToastProvider>
      </ProgressProvider>
    </AuthProvider>
  );
}
