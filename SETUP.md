# Setup Guide

## Prerequisites

- Python 3.10-3.13 recommended (`3.14` currently breaks parts of the backend dependency stack)
- Node.js 18+
- npm 9+
- (Optional) Docker for PostgreSQL
- (Optional) Terraform 1.5+ for AWS deployment

## Backend Setup

### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in the `backend/` directory (optional — defaults work for local dev):

```env
DATABASE_URL=sqlite:///./team_management.db
SECRET_KEY=your-jwt-secret-key
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEBUG=true
```

### 3. Initialize database

```bash
# Creates tables and seeds with realistic ACME data
python seed.py
```

### 4. Start the backend server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

The API is now available at `http://localhost:8000`.
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

The frontend is now available at `http://localhost:5173`.

The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

## Using PostgreSQL (Production-like)

If you have Docker:

```bash
# From project root
docker-compose up -d

# Update backend/.env
DATABASE_URL=postgresql://tms_user:tms_password_dev@localhost:5432/team_management
```

Or with an existing PostgreSQL:

```bash
# Create database
createdb -U postgres team_management
createuser -U postgres tms_user -P

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://tms_user:password@localhost:5432/team_management
```

## Running Tests

```bash
cd backend
python -m pytest tests/ -v                    # All tests
python -m pytest tests/ --cov=app --cov-report=term-missing  # With coverage
python -m pytest tests/test_analytics.py -v   # Just analytics tests
```

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Port 8000 in use | Use `--port 8001` and update Vite proxy |
| Database errors | Delete `team_management.db` and re-run `seed.py` |
| CORS errors | Check `CORS_ORIGINS` in backend config |
| Module not found | Ensure you're in the correct directory when running commands |
| `DEBUG` validation error | Set `DEBUG` to `true` or `false` (values like `release` now map to `false`) |
| `psycopg2-binary` install error on Python 3.14 | Use Python 3.10-3.13 for now, or skip PostgreSQL locally and use the default SQLite setup |
