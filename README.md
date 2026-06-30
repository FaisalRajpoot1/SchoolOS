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

```bash
# Server
cd server && npm install && cp .env.example .env && npm run dev

# Client
cd client && npm install && cp .env.example .env && npm run dev
```

## Documentation

See [`MASTER_PROJECT_GUIDE.md`](MASTER_PROJECT_GUIDE.md) for engineering standards and [`reqs.md`](reqs.md) for the full feature/module breakdown.
