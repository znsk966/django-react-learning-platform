# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A learning platform with a Django DRF backend serving a REST API and a React + Vite frontend. Content is organized as Modules (containing ordered Lessons with Markdown content).

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

# Run tests
python manage.py test

# Run tests for a specific app
python manage.py test content
python manage.py test users
```

### Frontend (run from `frontend/` directory)

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (http://localhost:5173)
npm run build      # Production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Environment Setup

Backend environment variables go in `backend/.env` (see `backend/.env.example`):

```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Frontend API URL is configured via `VITE_API_URL` env var (defaults to `http://localhost:8000/api`).

## Architecture

### Backend (`backend/`)

- **`backend/`** — Django project settings, URLs, WSGI/ASGI
- **`content/`** — Main app: `Module` and `Lesson` models, read-only DRF ViewSets, serializers with filters
- **`users/`** — Placeholder app (no models or views yet)

**Data model:** `Module` (title, slug, description) → `Lesson` (title, slug, content_md, order, FK to Module)

**API endpoints:**
- `GET /api/modules/` — list all modules (with nested lessons in detail)
- `GET /api/modules/{id}/` — module detail
- `GET /api/lessons/` — list lessons (filterable by `?module={id}`)
- `GET /api/lessons/{id}/` — lesson detail

All viewsets are read-only (`ReadOnlyModelViewSet`). Filtering uses `django-filter`. Lesson content is stored as Markdown in `content_md`.

### Frontend (`frontend/src/`)

- **`api/client.js`** — Axios instance; exports `getModules`, `getModuleById`, `getLessons`, `getLessonsByModule`, `getLessonById`
- **`pages/`** — `ModulesPage`, `ModuleDetail`, `LessonPage`, `Dashboard` (stats/charts via Recharts)
- **`components/`** — `NavBar`, `ModuleCard`, `LessonCard`, `MarkdownRenderer` (ReactMarkdown + Prism syntax highlighting)

Routing via React Router DOM v7. Markdown rendering uses `react-markdown` with `remark-gfm` and `react-syntax-highlighter` (Prism).

### Key dependencies

| Backend | Frontend |
|---------|----------|
| Django 5.2, DRF 3.16 | React 19, React Router 7 |
| django-cors-headers | Axios |
| django-filter | react-markdown + remark-gfm |
| django-mdeditor | react-syntax-highlighter |
| python-decouple | Recharts, Lucide React |
| psycopg2-binary (PostgreSQL ready) | Vite 7 |
