# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A learning platform with a Django DRF backend serving a REST API and a React + Vite frontend. Content is organized as Modules (containing ordered Lessons with Markdown content). Users can register, log in, and authenticate via JWT.

## Development Commands

### Backend (run from `backend/` directory)

```bash
# Activate virtual environment (from project root)
source venv/Scripts/activate  # Windows bash

# Run development server
python manage.py runserver

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test content
python manage.py test users
```

### Frontend (run from `frontend/` directory)

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run lint             # Run ESLint
npm run preview          # Preview production build
npm run test             # Run Vitest in watch mode
npm run test:coverage    # Run tests with coverage report
```

## Environment Setup

Backend environment variables go in `backend/.env` (see `backend/.env.example`):

```python
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

Frontend API URL is configured via `VITE_API_URL` env var (defaults to `http://localhost:8000/api`).

## Architecture

### Backend (`backend/`)

- **`backend/`** — Django project settings, URLs, WSGI/ASGI
- **`content/`** — `Module` and `Lesson` models, read-only DRF ViewSets, serializers, filters, tests
- **`users/`** — Registration, JWT login, and current-user endpoint; serializers and tests
- **`logs/`** — Django log output (`django.log`); created automatically on server start

**Data model:** `Module` (title, slug, description max 2000 chars) → `Lesson` (title, slug, content_md, order ≥ 1, FK to Module)

**API endpoints:**

| Method | URL | Description | Auth required |
| -------- | ----- | ------------- | --------------- |
| GET | `/api/modules/` | List modules (paginated) | No |
| GET | `/api/modules/{id}/` | Module detail with nested lessons | No |
| GET | `/api/lessons/` | List lessons (filterable by `?module=`, `?title=`, `?order=`) | No |
| GET | `/api/lessons/{id}/` | Lesson detail | No |
| POST | `/api/auth/register/` | Create account | No |
| POST | `/api/auth/token/` | Login — returns `access` + `refresh` JWT | No |
| POST | `/api/auth/token/refresh/` | Exchange refresh token for new access token | No |
| GET | `/api/auth/me/` | Current user info | Yes (Bearer) |
| GET | `/api/schema/` | OpenAPI schema (drf-spectacular) | No |
| GET | `/api/docs/` | Swagger UI | No |
| GET | `/api/redoc/` | ReDoc UI | No |

All content viewsets are read-only (`ReadOnlyModelViewSet`). Pagination is enabled globally (`PAGE_SIZE=20`). List responses follow the format `{ count, next, previous, results: [...] }`.

**Authentication:** JWT via `djangorestframework-simplejwt`. Access tokens expire after 1 hour; refresh tokens after 7 days. Default permission class is `AllowAny`; protected endpoints set `IsAuthenticated` explicitly.

**Logging:** WARNING+ for Django internals, DEBUG+ for the `content` app. Logs go to console and `logs/django.log`.

### Frontend (`frontend/src/`)

- **`api/client.js`** — Axios instance with JWT request interceptor and status-aware error messages (`userMessage`). Exports: `getModules`, `getModuleById`, `getLessons`, `getLessonsByModule`, `getLessonById`, `registerUser`, `loginUser`, `getMe`
- **`context/AuthContext.jsx`** — `AuthProvider` + `useAuth()` hook. Stores `user` and `authLoading`; restores session from `localStorage` on mount. Exposes `login(access, refresh, user)` and `logout()`
- **`pages/`** — `ModulesPage`, `ModuleDetail`, `LessonPage`, `Dashboard`, `LoginPage`, `RegisterPage`
- **`components/`** — `NavBar` (auth-aware), `ModuleCard`, `LessonCard`, `MarkdownRenderer`
- **`test/setup.js`** — Vitest global setup (jest-dom matchers, localStorage reset)

**Routing** via React Router DOM v7. Auth routes: `/login`, `/register`. Content routes: `/`, `/modules/:id`, `/lesson/:id`, `/dashboard`.

**Auth flow:** Register → auto-login → home. Login → home. Sign Out → `/login`. On 401 with an active token, tokens are cleared and user is redirected to `/login`.

**Token handling:** `access_token` and `refresh_token` are stored in `localStorage`. The Axios request interceptor attaches `Authorization: Bearer <token>` automatically.

**Error handling:** The Axios response interceptor sets `error.userMessage` with a human-readable string based on HTTP status (404 → "Not found.", 403 → "Access denied.", 5xx → "Server error. Please try again later.", network → "Network error...").

**Dynamic titles:** Every page sets `document.title` on mount (e.g. `"Python Basics | Learning Platform"`).

### Testing

**Backend:** 43 tests across `content/tests.py` and `users/tests.py` using Django's `APITestCase`.

**Frontend:** 53 tests across 8 files using Vitest + React Testing Library.

| File | Coverage |
| ------ | ---------- |
| `AuthContext.test.jsx` | Session restore, login, logout, failed token |
| `NavBar.test.jsx` | Logged-in/out UI, Sign Out click |
| `LoginPage.test.jsx` | Form, success flow, errors, loading state |
| `RegisterPage.test.jsx` | Form, auto-login, field errors, loading state |
| `ModulesPage.test.jsx` | Loading, paginated data, empty/error states |
| `ModuleDetail.test.jsx` | Loading, title, lessons list, empty/error states |
| `LessonPage.test.jsx` | Loading, content, back links, error states |
| `Dashboard.test.jsx` | Stats, charts, empty/error states |

API calls are mocked with `vi.mock`. `useAuth` is mocked for page-level tests. Recharts and MarkdownRenderer are mocked to avoid SVG/complex rendering in jsdom.

### Key dependencies

| Backend | Frontend |
| --------- | ---------- |
| Django 5.2, DRF 3.16 | React 19, React Router 7 |
| djangorestframework-simplejwt | Axios |
| django-cors-headers | react-markdown + remark-gfm |
| django-filter | react-syntax-highlighter |
| drf-spectacular (OpenAPI) | Recharts, Lucide React |
| django-mdeditor | Vite 7 |
| python-decouple | Vitest + React Testing Library |
| psycopg2-binary (PostgreSQL ready) | |
