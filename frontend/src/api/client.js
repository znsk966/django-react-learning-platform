import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error('API Error:', status, data);
      if (status === 401 && error.config?.headers?.Authorization) {
        // Authenticated request was rejected — token expired or invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        error.userMessage = 'Session expired. Please sign in again.';
      } else if (status === 404) {
        error.userMessage = 'Not found.';
      } else if (status === 403) {
        error.userMessage = 'Access denied.';
      } else if (status >= 500) {
        error.userMessage = 'Server error. Please try again later.';
      } else {
        error.userMessage = data?.detail || `Request failed (${status}).`;
      }
    } else if (error.request) {
      console.error('Network Error:', error.request);
      error.userMessage = 'Network error. Please check your connection.';
    } else {
      console.error('Error:', error.message);
      error.userMessage = 'An unexpected error occurred.';
    }
    return Promise.reject(error);
  }
);

export const getModules = (params) => apiClient.get('/modules/', { params });
export const getTags = () => apiClient.get('/tags/');
export const getModuleById = (id) => apiClient.get(`/modules/${id}/`);
export const getLessons = () => apiClient.get('/lessons/');
export const getLessonsByModule = (moduleId) =>
  apiClient.get('/lessons/', { params: { module: moduleId } });
export const getLessonById = (id) => apiClient.get(`/lessons/${id}/`);

export const registerUser = (data) => apiClient.post('/auth/register/', data);
export const loginUser = (data) => apiClient.post('/auth/token/', data);
export const getMe = () => apiClient.get('/auth/me/');

export const getProgress = (params) => apiClient.get('/progress/', { params });
export const markLessonComplete = (lessonId) => apiClient.post('/progress/', { lesson: lessonId });
export const markLessonIncomplete = (lessonId) => apiClient.delete(`/progress/${lessonId}/`);