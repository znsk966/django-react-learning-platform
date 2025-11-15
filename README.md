# Django DRF + React Learning App

A demo application showcasing the integration between Django REST Framework (DRF) with django-mdeditor as the backend and React built with Vite and react-markdown for the frontend. This application provides a learning platform where users can browse modules and lessons with markdown content.

## Features

- **Backend (Django + DRF)**
  - RESTful API with Django REST Framework
  - Markdown editor support with django-mdeditor
  - CORS configuration for frontend integration
  - Filtering support with django-filter
  - SQLite database (can be easily switched to PostgreSQL)

- **Frontend (React + Vite)**
  - Modern React application with Vite
  - React Router for navigation
  - Markdown rendering with react-markdown and syntax highlighting
  - Dashboard with charts using Recharts
  - Responsive design with plain CSS
  - Error handling and loading states

## Tech Stack

### Backend
- Django 5.2.8
- Django REST Framework 3.16.1
- django-cors-headers 4.9.0
- django-filter 25.2
- django-mdeditor 0.1.20
- python-decouple 3.8

### Frontend
- React 19.2.0
- React Router DOM 7.9.5
- Vite 7.2.2
- react-markdown 10.1.0
- react-syntax-highlighter 16.1.0
- recharts 3.4.1
- axios 1.13.2
- remark-gfm 4.0.1

## Project Structure

```
django-drf-react-learning-app/
├── backend/
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   ├── content/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   └── ...
│   ├── users/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Linux/Mac
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create a `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the SECRET_KEY if needed:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   ```

5. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server:**
   ```bash
   python manage.py runserver
   ```
   
   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## Usage

1. **Access the Admin Panel:**
   - Navigate to `http://localhost:8000/admin`
   - Login with your superuser credentials
   - Create modules and lessons with markdown content

2. **Browse the Application:**
   - Open `http://localhost:5173` in your browser
   - Browse modules on the home page
   - Click on a module to see its lessons
   - Click on a lesson to view its markdown content
   - Check the dashboard for statistics and charts

## API Endpoints

- `GET /api/modules/` - List all modules
- `GET /api/modules/{id}/` - Get a specific module
- `GET /api/lessons/` - List all lessons
- `GET /api/lessons/{id}/` - Get a specific lesson
- `GET /api/lessons/?module={module_id}` - Filter lessons by module

## Improvements Made

### UX/UI Improvements
- ✅ Added loading states for all API calls
- ✅ Added error handling with user-friendly error messages
- ✅ Improved styling with modern CSS (gradients, shadows, transitions)
- ✅ Added empty states for better user feedback
- ✅ Enhanced card components with hover effects
- ✅ Improved navigation with better link styling
- ✅ Added responsive design for mobile devices
- ✅ Enhanced dashboard with statistics cards
- ✅ Better markdown rendering with improved styling

### Code Refactoring
- ✅ Added error handling to all API calls
- ✅ Improved component structure and prop handling
- ✅ Fixed file naming inconsistencies (Moduledetail → ModuleDetail)
- ✅ Added proper loading and error states
- ✅ Improved code organization and readability
- ✅ Added better prop validation and null checks

### Security Improvements
- ✅ Moved SECRET_KEY to environment variables
- ✅ Made DEBUG configurable via environment variables
- ✅ Made ALLOWED_HOSTS configurable
- ✅ Made CORS_ALLOWED_ORIGINS configurable
- ✅ Created .env.example for reference

### GitHub Preparation
- ✅ Created comprehensive .gitignore file
- ✅ Created README.md with setup instructions
- ✅ Created requirements.txt for backend dependencies
- ✅ Created .env.example for environment variables
- ✅ Fixed security issues (no hardcoded secrets in code)

## Development Notes

- The app uses SQLite by default for simplicity. For production, consider using PostgreSQL.
- CORS is configured to allow requests from `http://localhost:5173` (Vite default port).
- The markdown editor is available in the Django admin panel at `/admin`.
- All API endpoints return JSON responses.

## Future Improvements

- [ ] Add user authentication and authorization
- [ ] Add lesson progress tracking
- [ ] Add search functionality
- [ ] Add pagination for large datasets
- [ ] Add unit tests
- [ ] Add CI/CD pipeline
- [ ] Add Docker support
- [ ] Switch to PostgreSQL for production
- [ ] Add API documentation with Swagger/OpenAPI
- [ ] Add dark mode support

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

