# API Documentation

Base URL: `http://localhost:8000/api`

Interactive docs: `http://localhost:8000/docs` (Swagger UI)

## Authentication

All authenticated endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@acme.com",
  "password": "SecurePass123",
  "role": "viewer"
}
```

**Response (201):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "name": "John Doe", "email": "john@acme.com", "role": "viewer", ... }
}
```

### POST /auth/login
Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "john@acme.com",
  "password": "SecurePass123"
}
```

### GET /auth/me
Get current user profile. **Auth required.**

---

## Users

### GET /users
List users with pagination and filters. **Admin/Manager only.**

**Query params:** `page`, `page_size`, `search`, `role`

### GET /users/{id}
Get user by ID. **Auth required.**

### PUT /users/{id}
Update user. Admins can update anyone. Users can update their own name. **Auth required.**

**Request:**
```json
{ "name": "Updated Name", "role": "contributor" }
```

### DELETE /users/{id}
Deactivate user (soft delete). **Admin only.**

---

## Teams

### GET /teams
List teams with search and filters. **Auth required.**

**Query params:** `page`, `page_size`, `search`, `location`, `leader_id`

### POST /teams
Create a team. **Admin/Manager only.**

**Request:**
```json
{
  "name": "Engineering",
  "location": "San Francisco",
  "leader_id": "uuid-optional",
  "org_leader_id": "uuid-optional"
}
```

### GET /teams/{id}
Get team details with members list. **Auth required.**

**Response includes:** team info, leader details, org leader details, all members with name/email/role/staff_type.

### PUT /teams/{id}
Update team. **Admin/Manager only.**

### DELETE /teams/{id}
Delete team (cascades to members + achievements). **Admin only.**

---

## Members

### GET /members
List team memberships. **Contributor+ required.**

**Query params:** `team_id`, `user_id`

### POST /members
Add a user to a team. **Contributor+ required.**

**Request:**
```json
{
  "user_id": "uuid",
  "team_id": "uuid",
  "role": "member",
  "is_direct_staff": true
}
```

### PUT /members/{id}
Update member role or staff type. **Admin/Manager only.**

### DELETE /members/{id}
Remove from team. **Admin/Manager only.**

---

## Achievements

### GET /achievements
List achievements with filters. **Auth required.**

**Query params:** `page`, `page_size`, `team_id`, `month` (YYYY-MM-DD)

### POST /achievements
Create achievement. **Contributor+ required.**

**Request:**
```json
{
  "team_id": "uuid",
  "month": "2024-01-01",
  "description": "Launched v2.0 with 99.9% uptime",
  "metrics": {"uptime": 99.9, "deployments": 45}
}
```

### PUT /achievements/{id}
Update achievement. **Contributor+ required.**

### DELETE /achievements/{id}
Delete achievement. **Admin/Manager only.**

---

## Analytics

### GET /analytics/team-insights
Team composition overview — members, locations, sizes, staff breakdown.

### GET /analytics/ratios
Direct vs non-direct staff ratios. Flags teams >20% non-direct.

### GET /analytics/leadership
Leadership analysis: co-location check, direct staff check, org hierarchy.

### GET /analytics/dashboard
Aggregated dashboard stats: KPI counts, teams by location, recent achievements, staff overview.

---

## Error Format

All errors return consistent JSON:
```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "Resource not found"
  }
}
```

## RBAC Matrix

| Endpoint | Admin | Manager | Contributor | Viewer |
|----------|-------|---------|-------------|--------|
| Register/Login | ✅ | ✅ | ✅ | ✅ |
| List Users | ✅ | ✅ | ❌ | ❌ |
| CRUD Teams | ✅ Create/Edit/Delete | ✅ Create/Edit | ❌ | ❌ |
| View Teams | ✅ | ✅ | ✅ | ✅ |
| Add Members | ✅ | ✅ | ✅ | ❌ |
| CRUD Achievements | ✅ | ✅ | ✅ Create/Edit | ✅ View |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ❌ | ❌ | ❌ |
