# API Reference

Base URL: `${API_PREFIX}` (default `/api/v1`). All responses use a JSON
envelope: `{ "success": boolean, "data"?: ..., "meta"?: ..., "message"?: ... }`.

Auth: send the access token as `Authorization: Bearer <token>`. The refresh
token is an httpOnly cookie set by the server.

## Health

| Method | Path             | Auth | Description            |
| ------ | ---------------- | ---- | ---------------------- |
| GET    | `/health/live`   | —    | Liveness probe         |
| GET    | `/health/ready`  | —    | Readiness (DB) probe   |

## Auth — Module 1

| Method | Path             | Auth   | Description                              |
| ------ | ---------------- | ------ | ---------------------------------------- |
| POST   | `/auth/register` | —      | Register a user in a school              |
| POST   | `/auth/login`    | —      | Login (email + password + schoolId)      |
| POST   | `/auth/refresh`  | cookie | Rotate refresh token, issue access token |
| POST   | `/auth/logout`   | cookie | Revoke refresh token                     |
| GET    | `/auth/me`       | Bearer | Current user profile                     |

## Schools — Module 2

Platform administration (role `SUPER_ADMIN`):

| Method | Path                  | Description                                     |
| ------ | --------------------- | ----------------------------------------------- |
| POST   | `/schools`            | Create a school + its first SCHOOL_ADMIN        |
| GET    | `/schools`            | List schools (`page`, `limit`, `search`, `isActive`, `sortBy`, `sortOrder`) |
| GET    | `/schools/:id`        | Get a school                                    |
| PATCH  | `/schools/:id`        | Update a school profile                         |
| PATCH  | `/schools/:id/status` | Activate / deactivate a school                  |

Tenant self-service (role `SCHOOL_ADMIN`):

| Method | Path           | Description                  |
| ------ | -------------- | ---------------------------- |
| GET    | `/schools/me`  | Get the caller's school      |
| PATCH  | `/schools/me`  | Update the caller's school   |

### Academic Years — Module 2 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                       | Description                          |
| ------ | -------------------------- | ------------------------------------ |
| POST   | `/academic-years`          | Create an academic year              |
| GET    | `/academic-years`          | List the school's academic years     |
| GET    | `/academic-years/:id`      | Get one academic year                |
| PATCH  | `/academic-years/:id`      | Update an academic year              |
| PATCH  | `/academic-years/:id/current` | Mark as the current session       |
| DELETE | `/academic-years/:id`      | Delete an academic year              |
