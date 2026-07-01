# SchoolOS

A production-grade, multi-tenant **School ERP** SaaS platform — a complete operating system for schools covering admissions, academics, attendance, fees, exams, HR, payroll, library, transport, communication, and more.

## Architecture

Monorepo with two independently deployable applications:

| Path        | Stack                                                                 | Deploy        |
| ----------- | --------------------------------------------------------------------- | ------------- |
| `client/`   | React, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Query     | Vercel        |
| `server/`   | Node.js, Express, TypeScript, Prisma, PostgreSQL                      | Render/Railway |

Both follow a **feature-first** architecture (see `MASTER_PROJECT_GUIDE.md`).

## Structure

```
SchoolOS/
├── client/          # React frontend (feature-first)
│   └── src/
│       ├── app/        # store + providers + root wiring
│       ├── components/ # shared UI (ui/, common/)
│       ├── features/   # feature modules (auth, dashboard, ...)
│       ├── lib/        # api client, react-query
│       ├── routes/     # router config
│       └── ...
├── server/          # Express API (feature-first)
│   ├── prisma/         # schema, migrations, seed
│   └── src/
│       ├── features/   # feature modules (controller/service/route/validation)
│       ├── middlewares/
│       ├── services/   # email, storage, payments
│       └── ...
└── docs/            # PRD, SRS, architecture, API, ER diagram
```

## Getting Started

Prerequisites: Node.js 20+, npm, and a running PostgreSQL instance.

```bash
# 1. Server — configure, migrate the DB, seed demo data, then run
cd server
npm install
cp .env.example .env          # set DATABASE_URL + JWT secrets (AI key optional)
npm run prisma:migrate        # applies the committed initial migration
npm run db:seed               # seeds a demo school + accounts
npm run dev                   # http://localhost:4000

# 2. Client (separate terminal)
cd client
npm install
cp .env.example .env
npm run dev                   # http://localhost:5173
```

### Demo accounts

All seeded with password `ChangeMe123!`:

| Role         | Email                  |
| ------------ | ---------------------- |
| SUPER_ADMIN  | `owner@schoolos.dev`   |
| SCHOOL_ADMIN | `admin@demo.school`    |
| TEACHER      | `teacher@demo.school`  |
| PARENT       | `parent@demo.school`   |
| LIBRARIAN    | `librarian@demo.school`|
| HR           | `hr@demo.school`       |

### Optional AI features

The AI Assistant (Module 25) runs on a deterministic rules engine out of the box.
Set `ANTHROPIC_API_KEY` in `server/.env` to enable Claude-powered report comments
and content generation (`AI_MODEL` defaults to `claude-opus-4-8`).

## Feature modules

All 25 modules are implemented end-to-end (server + client). Highlights: multi-tenant
auth with RBAC & audit logs, school/academic setup, students & guardians, teachers,
timetable, attendance, exams & results, homework & assignments, fees & invoicing,
library, transport, hostel, inventory, HR & payroll, parent portal, announcements &
events, certificates with public verification, an admin dashboard, reports with CSV
export, API keys, and an AI assistant. Endpoint reference: [`docs/API.md`](docs/API.md).

## Documentation

See [`MASTER_PROJECT_GUIDE.md`](MASTER_PROJECT_GUIDE.md) for engineering standards and [`reqs.md`](reqs.md) for the full feature/module breakdown.
