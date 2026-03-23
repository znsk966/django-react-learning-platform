# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A learning platform with a Django DRF backend serving a REST API and a React + Vite frontend. Content is organized as Modules (containing ordered Lessons with Markdown content). Users can register, log in, and authenticate via JWT. A **Free/Pro subscription model** gates Advanced modules behind a Stripe-powered paywall.

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
python manage.py test subscriptions
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

### Stripe (local webhook testing)

```bash
stripe listen --forward-to localhost:8000/api/subscriptions/webhook/
```

## Environment Setup

Backend environment variables go in `backend/.env` (see `backend/.env.example`):

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Stripe (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
```

Frontend API URL is configured via `VITE_API_URL` env var (defaults to `http://localhost:8000/api`).

## Architecture

### Backend (`backend/`)

- **`backend/`** — Django project settings, URLs, WSGI/ASGI
- **`content/`** — `Module`, `Lesson`, `Tag` models, read-only DRF ViewSets, serializers, filters, tests
- **`users/`** — Registration, JWT login, current-user and profile-update endpoints; `UserProfile` model; signals; serializers and tests
- **`subscriptions/`** — Stripe Checkout, webhook handler, Customer Portal, and status endpoints; tests
- **`progress/`** — `LessonProgress` model, mark complete/incomplete endpoints
- **`logs/`** — Django log output (`django.log`); created automatically on server start

**Data models:**
- `Module` (title, slug, description max 2000 chars, difficulty [beginner/intermediate/**advanced**], estimated_duration, learning_objectives, thumbnail, tags M2M, author FK, is_published)
- `Lesson` (title, slug, content_md, order ≥ 1, FK to Module)
- `Tag` (name, slug)
- `LessonProgress` (user FK, lesson FK, completed_at — unique per user+lesson)
- `UserProfile` (one-to-one with User; subscription_tier [free/pro], subscription_status [active/inactive/cancelled/past_due], stripe_customer_id, stripe_subscription_id, current_period_end, bio; `is_pro` property checks both tier AND status)

**API endpoints:**

| Method | URL | Description | Auth required |
| -------- | ----- | ------------- | --------------- |
| GET | `/api/modules/` | List modules (paginated, `is_locked` field per user) | No |
| GET | `/api/modules/{id}/` | Module detail with nested lessons | No |
| GET | `/api/lessons/` | List lessons (filterable by `?module=`, `?title=`, `?order=`) | No |
| GET | `/api/lessons/{id}/` | Lesson detail — **403 for free users on Advanced modules** | No* |
| GET | `/api/tags/` | All tags (no pagination) | No |
| GET | `/api/progress/` | User's completed lessons | Yes |
| POST | `/api/progress/` | Mark lesson complete | Yes |
| DELETE | `/api/progress/{lessonId}/` | Mark lesson incomplete | Yes |
| POST | `/api/auth/register/` | Create account | No |
| POST | `/api/auth/token/` | Login — returns `access` + `refresh` JWT | No |
| POST | `/api/auth/token/refresh/` | Exchange refresh token for new access token | No |
| GET | `/api/auth/me/` | Current user info (includes nested `profile`) | Yes (Bearer) |
| PATCH | `/api/auth/profile/` | Update name, email, bio | Yes (Bearer) |
| POST | `/api/subscriptions/create-checkout-session/` | Create Stripe Checkout session | Yes |
| POST | `/api/subscriptions/webhook/` | Stripe webhook handler | No (sig-verified) |
| GET | `/api/subscriptions/portal/` | Create Stripe Customer Portal session | Yes |
| GET | `/api/subscriptions/status/` | Current subscription status | Yes |
| GET | `/api/schema/` | OpenAPI schema (drf-spectacular) | No |
| GET | `/api/docs/` | Swagger UI | No |
| GET | `/api/redoc/` | ReDoc UI | No |

All content viewsets are read-only (`ReadOnlyModelViewSet`). Pagination is enabled globally (`PAGE_SIZE=20`). List responses follow the format `{ count, next, previous, results: [...] }`.

**Content gating:** `ModuleSerializer` includes `is_locked: bool` — `true` for Advanced modules when the requesting user is not Pro (or unauthenticated). `LessonViewSet.retrieve` raises `PermissionDenied` (403) for free/unauthenticated users requesting an Advanced lesson's detail. List endpoints are never gated.

**Authentication:** JWT via `djangorestframework-simplejwt`. Access tokens expire after 1 hour; refresh tokens after 7 days. Default permission class is `AllowAny`; protected endpoints set `IsAuthenticated` explicitly.

**Stripe webhook:** Uses `stripe.Webhook.construct_event(request.body, ...)` for signature verification. Handles `checkout.session.completed` (upgrade to Pro), `customer.subscription.updated` (sync status), `customer.subscription.deleted` (downgrade to Free). Looks up `UserProfile` by `stripe_customer_id`.

**Logging:** WARNING+ for Django internals, DEBUG+ for the `content` app. Logs go to console and `logs/django.log`.

### Frontend (`frontend/src/`)

- **`api/client.js`** — Axios instance with JWT request interceptor and status-aware error messages (`userMessage`). Exports: `getModules`, `getModuleById`, `getLessons`, `getLessonsByModule`, `getLessonById`, `registerUser`, `loginUser`, `getMe`, `getProgress`, `markLessonComplete`, `markLessonIncomplete`, `updateProfile`, `createCheckoutSession`, `getSubscriptionStatus`, `getCustomerPortal`
- **`context/AuthContext.jsx`** — `AuthProvider` + `useAuth()` hook. Stores `user` and `authLoading`; restores session from `localStorage` on mount. Exposes `login(access, refresh, user)`, `logout()`, `refreshUser()` (re-fetches `/api/auth/me/` — used after Stripe checkout returns)
- **`context/ProgressContext.jsx`** — `useProgress()` hook; fetches all completed lesson IDs on auth
- **`context/ToastContext.jsx`** — `useToast()` hook; auto-dismissing toast notifications
- **`pages/`** — `ModulesPage`, `ModuleDetail`, `LessonPage`, `Dashboard`, `LoginPage`, `RegisterPage`, `ProfilePage`
- **`components/`** — `NavBar` (auth-aware, Profile link with Pro badge), `ModuleCard` (lock overlay for gated modules), `LessonCard`, `MarkdownRenderer`
- **`test/setup.js`** — Vitest global setup (jest-dom matchers, localStorage reset)

**Routing** via React Router DOM v7. Auth routes: `/login`, `/register`. Content routes: `/`, `/modules/:id`, `/lesson/:id`, `/dashboard`, `/profile`.

**Auth flow:** Register → auto-login → home. Login → home. Sign Out → `/login`. On 401 with an active token, tokens are cleared and user is redirected to `/login`.

**Token handling:** `access_token` and `refresh_token` are stored in `localStorage`. The Axios request interceptor attaches `Authorization: Bearer <token>` automatically.

**Error handling:** The Axios response interceptor sets `error.userMessage` with a human-readable string based on HTTP status (404 → "Not found.", 403 → "Access denied.", 5xx → "Server error. Please try again later.", network → "Network error..."). `LessonPage` additionally checks `err.response?.status === 403` to show a dedicated upgrade prompt instead of a generic error.

**Dynamic titles:** Every page sets `document.title` on mount (e.g. `"Python Basics | Learning Platform"`).

**Profile page (`/profile`):**
- Avatar initials (same logic as NavBar — first+last name initials, fallback to username)
- Edit form: `first_name`, `last_name`, `email`, `bio` → `PATCH /api/auth/profile/`
- Subscription card: shows Free/Pro badge; Free users get "Upgrade to Pro" (Stripe Checkout); Pro users get "Manage Subscription" (Stripe Portal) + renewal date
- Learning stats: total lessons completed, day streak (computed from `completed_at` timestamps fetched from `/api/progress/`)

### Testing

**Backend:** 113 tests across `content/tests.py`, `users/tests.py`, `subscriptions/tests.py`, and `progress/tests.py` using Django's `APITestCase`. Stripe SDK calls are mocked with `unittest.mock.patch`.

**Frontend:** 91 tests across 10 files using Vitest + React Testing Library.

| File | Coverage |
| ------ | ---------- |
| `AuthContext.test.jsx` | Session restore, login, logout, failed token |
| `NavBar.test.jsx` | Logged-in/out UI, Sign Out click |
| `LoginPage.test.jsx` | Form, success flow, errors, loading state |
| `RegisterPage.test.jsx` | Form, auto-login, field errors, loading state |
| `ModulesPage.test.jsx` | Loading, paginated data, empty/error states |
| `ModuleDetail.test.jsx` | Loading, title, lessons list, empty/error states |
| `LessonPage.test.jsx` | Loading, content, back links, error states, 403 upgrade prompt |
| `Dashboard.test.jsx` | Stats, charts, empty/error states, Pro badge, quick actions |
| `ModuleCard.test.jsx` | Unlocked (Link), locked (overlay, lock icon, Pro badge, upgrade link) |
| `ProfilePage.test.jsx` | Avatar, Free/Pro badge, edit form, upgrade/manage buttons, streak |

API calls are mocked with `vi.mock`. `useAuth` is mocked for page-level tests. Recharts, MarkdownRenderer, and Lucide React icons are mocked to avoid SVG/complex rendering in jsdom.

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
| stripe 14.4 | |
| psycopg2-binary (PostgreSQL ready) | |
