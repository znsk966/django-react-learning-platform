# Django DRF + React Learning App

A full-featured learning platform built with Django REST Framework and React + Vite. Content is organized as Modules containing ordered Lessons with Markdown content. Users can register, log in, track their progress, and subscribe to a **Pro plan** to unlock Advanced modules.

## Features

- **Content:** Modules with difficulty levels (Beginner / Intermediate / Advanced), tags, estimated duration, and learning objectives. Lessons with full Markdown support and syntax-highlighted code blocks.
- **Authentication:** JWT-based registration and login. Session persists across page refreshes via `localStorage`.
- **Progress tracking:** Mark lessons complete/incomplete. Progress persists per user.
- **Subscription model:** Free and Pro tiers. Advanced modules are locked for free users. Stripe-powered checkout and billing portal.
- **User profile:** Edit name, email, and bio. View subscription status and learning stats (lessons completed, streak).
- **Dashboard:** Analytics with Recharts — lessons per module, completion per module, pie chart. Quick-action cards and Pro badge for subscribers.
- **API documentation:** Auto-generated OpenAPI schema via drf-spectacular (Swagger UI + ReDoc).

## Tech Stack

### Backend
| Package | Version |
|---------|---------|
| Django | 5.2.8 |
| Django REST Framework | 3.16.1 |
| djangorestframework-simplejwt | 5.5.0 |
| django-cors-headers | 4.9.0 |
| django-filter | 25.2 |
| django-mdeditor | 0.1.20 |
| drf-spectacular | 0.28.0 |
| stripe | 14.4.1 |
| python-decouple | 3.8 |
| psycopg2-binary | 2.9.11 |

### Frontend
| Package | Version |
|---------|---------|
| React | 19 |
| React Router DOM | 7 |
| Vite | 7 |
| Axios | 1.x |
| react-markdown + remark-gfm | 10.x / 4.x |
| react-syntax-highlighter | 16.x |
| Recharts | 3.x |
| Lucide React | latest |
| Vitest + React Testing Library | latest |

## Project Structure

```
django-drf-react-learning-app/
├── backend/
│   ├── backend/          # Django project settings & URLs
│   ├── content/          # Module, Lesson, Tag models + API
│   ├── users/            # User auth, UserProfile, subscription data model
│   ├── subscriptions/    # Stripe Checkout, webhook, Portal endpoints
│   ├── progress/         # LessonProgress model + API
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/          # Axios client + all API functions
│       ├── components/   # NavBar, ModuleCard, LessonCard, MarkdownRenderer
│       ├── context/      # AuthContext, ProgressContext, ToastContext
│       └── pages/        # ModulesPage, ModuleDetail, LessonPage,
│                         # Dashboard, LoginPage, RegisterPage, ProfilePage
├── venv/
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

1. **Create and activate a virtual environment** (from the project root):
   ```bash
   python -m venv venv
   source venv/Scripts/activate   # Windows bash
   # source venv/bin/activate     # Linux/Mac
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Create `.env`** (copy the example and fill in your values):
   ```bash
   cp .env.example .env
   ```

   Minimum required:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   CSRF_TRUSTED_ORIGINS=http://localhost:5173
   FRONTEND_URL=http://localhost:5173
   ```

   For Stripe (required for subscription features):
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRO_PRICE_ID=price_...
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (to access the admin panel):
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```
   Backend available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend available at `http://localhost:5173`

### Stripe Webhook (local development)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
```bash
stripe listen --forward-to localhost:8000/api/subscriptions/webhook/
```
Copy the webhook signing secret it prints and set it as `STRIPE_WEBHOOK_SECRET` in your `.env`.

## Usage

### Admin panel
Navigate to `http://localhost:8000/admin` and log in with your superuser. Create Modules, Lessons, and Tags. Set a module's **difficulty** to `Advanced` to gate it behind Pro.

### Application
| URL | Description |
|-----|-------------|
| `http://localhost:5173/` | Browse modules (filtered by difficulty / tag) |
| `/modules/:id` | Module detail with lessons list and progress bar |
| `/lesson/:id` | Lesson content with Mark Complete button |
| `/dashboard` | Analytics dashboard |
| `/profile` | Edit profile, manage subscription, view stats |
| `/login` | Sign in |
| `/register` | Create account |

## API Endpoints

### Content
| Method | URL | Auth |
|--------|-----|------|
| GET | `/api/modules/` | No |
| GET | `/api/modules/{id}/` | No |
| GET | `/api/lessons/` | No |
| GET | `/api/lessons/{id}/` | No* |
| GET | `/api/tags/` | No |

*Returns 403 for free/anonymous users on Advanced lessons.

### Auth
| Method | URL | Auth |
|--------|-----|------|
| POST | `/api/auth/register/` | No |
| POST | `/api/auth/token/` | No |
| POST | `/api/auth/token/refresh/` | No |
| GET | `/api/auth/me/` | Yes |
| PATCH | `/api/auth/profile/` | Yes |

### Progress
| Method | URL | Auth |
|--------|-----|------|
| GET | `/api/progress/` | Yes |
| POST | `/api/progress/` | Yes |
| DELETE | `/api/progress/{lessonId}/` | Yes |

### Subscriptions
| Method | URL | Auth |
|--------|-----|------|
| POST | `/api/subscriptions/create-checkout-session/` | Yes |
| POST | `/api/subscriptions/webhook/` | No (Stripe signature) |
| GET | `/api/subscriptions/portal/` | Yes |
| GET | `/api/subscriptions/status/` | Yes |

### Docs
- `GET /api/schema/` — OpenAPI schema
- `GET /api/docs/` — Swagger UI
- `GET /api/redoc/` — ReDoc

## Running Tests

```bash
# Backend (113 tests)
cd backend
python manage.py test

# Frontend (91 tests)
cd frontend
npm run test -- --run
```

## Development Notes

- SQLite is used by default. Switch to PostgreSQL by updating `DATABASES` in `settings.py` and providing `DATABASE_URL` or individual connection variables. `psycopg2-binary` is already installed.
- CORS allows `http://localhost:5173` by default. Update `CORS_ALLOWED_ORIGINS` for other origins.
- The Markdown editor is available in the Django admin at `/admin` via django-mdeditor.
- The `UserProfile` is auto-created for every new user via a `post_save` signal.
- Stripe webhooks use signature verification — always use `request.body` (raw bytes) before DRF parses the request.

## License

MIT License
