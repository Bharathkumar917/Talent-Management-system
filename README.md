# ACME Team Management System

A production-ready, full-stack web application for centralized team management at ACME Inc.

![Stack](https://img.shields.io/badge/Frontend-React%20+%20MUI-blue)
![Stack](https://img.shields.io/badge/Backend-FastAPI-green)
![Stack](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite-orange)
![Stack](https://img.shields.io/badge/Infra-Terraform%20+%20AWS-purple)

## 🎯 Overview

ACME Inc. needed a centralized system to replace fragmented data across multiple systems. This Team Management System provides:

- **Team Management** — Create, view, and manage team structures
- **Member Tracking** — Assign users to teams with role and staff type metadata
- **Achievement Tracking** — Monthly KPI and accomplishment logging per team
- **Organizational Analytics** — Business insights including leadership analysis, staff ratios, and hierarchy tracking
- **Role-Based Access Control** — Admin, Manager, Contributor, and Viewer roles

## 📊 Business Insights

The system computes these critical metrics:

| Insight | API Endpoint |
|---------|-------------|
| Team members & composition | `GET /api/analytics/team-insights` |
| Team locations | `GET /api/analytics/team-insights` |
| Monthly achievements | `GET /api/achievements?team_id=X&month=Y` |
| Leader NOT co-located | `GET /api/analytics/leadership` |
| Leader NOT direct staff | `GET /api/analytics/leadership` |
| Teams >20% non-direct staff | `GET /api/analytics/ratios` |
| Teams reporting to org leader | `GET /api/analytics/leadership` |

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Material UI 9, Recharts, Framer Motion |
| Backend | Python, FastAPI, SQLAlchemy 2.0, Pydantic |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT (python-jose), bcrypt |
| Infra | Terraform, AWS (Lambda, API Gateway, S3, CloudFront, RDS) |
| Testing | pytest (backend), 57 tests |

## 🚀 Quick Start

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
python seed.py           # Create database + seed data
python -m uvicorn app.main:app --reload --port 8000

# 2. Frontend  
cd frontend
npm install
npm run dev              # Starts on http://localhost:5173
```

**Demo Login:** `sarah.chen@acme.com` / `Password123!`

## 📁 Project Structure

```
team-management-system/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Settings
│   │   ├── database.py       # SQLAlchemy
│   │   ├── models/           # ORM models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API routes
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth + RBAC
│   │   └── utils/            # Security, exceptions
│   ├── tests/                # 57 pytest tests
│   └── seed.py               # Database seeder
├── frontend/
│   └── src/
│       ├── api/              # Axios client
│       ├── components/       # Layout, shared UI
│       ├── contexts/         # Auth context
│       ├── pages/            # 7 page components
│       └── theme/            # MUI dark theme
├── infrastructure/           # Terraform AWS modules
├── docker-compose.yml        # Local PostgreSQL
└── docs (this file + API.md, SETUP.md, DEPLOYMENT.md)
```

## 🧪 Testing

```bash
cd backend
python -m pytest tests/ -v     # Run all 57 tests
python -m pytest tests/ --cov=app --cov-report=term-missing  # With coverage
```

## 📄 Documentation

- [API Documentation](API.md)
- [Setup Guide](SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Self Evaluation](SELF_EVALUATION.md)

## 👥 Default Users

| Name | Email | Role | Password |
|------|-------|------|----------|
| Sarah Chen | sarah.chen@acme.com | Admin | Password123! |
| James Wilson | james.wilson@acme.com | Manager | Password123! |
| Priya Sharma | priya.sharma@acme.com | Manager | Password123! |
| Emily Davis | emily.davis@acme.com | Contributor | Password123! |
| Tom Brown | tom.brown@acme.com | Viewer | Password123! |
