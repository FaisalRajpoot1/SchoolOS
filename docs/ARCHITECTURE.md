# Architecture

> Living document. Expand as modules land.

## Overview

SchoolOS is a **multi-tenant SaaS School ERP**. A single deployment serves many schools (tenants); every domain record is scoped by `schoolId`. `SUPER_ADMIN` operates across tenants; all other roles are bound to one school.

## Topology

```
┌──────────────┐        HTTPS / JSON        ┌──────────────┐        SQL        ┌──────────────┐
│   client/    │ ─────────────────────────▶ │   server/    │ ────────────────▶ │  PostgreSQL  │
│ React + Vite │ ◀───────────────────────── │ Express API  │ ◀──────────────── │   (Prisma)   │
└──────────────┘                            └──────────────┘                   └──────────────┘
```

## Backend (`server/`)

Feature-first modules under `src/features/<feature>/`, each owning its
`*.routes.ts`, `*.controller.ts`, `*.service.ts`, and `*.validation.ts`.
Cross-cutting concerns live in `middlewares/`, `services/`, `utils/`, `config/`.

- **Validation**: Zod schemas at the edge via `validate` middleware.
- **Errors**: throw `ApiError`; the central `errorHandler` formats responses.
- **Auth**: JWT access + rotating refresh tokens (hashed, revocable).
- **Tenancy**: enforced in services via `schoolId` scoping.

## Frontend (`client/`)

Feature-first under `src/features/`. Global wiring in `src/app/`
(Redux store, providers). Server state via React Query (`src/lib/queryClient.ts`),
client/UI state via Redux Toolkit. HTTP through the shared Axios instance
(`src/lib/axios.ts`).

## Roadmap

See [`../reqs.md`](../reqs.md) for the full module list and phased roadmap.
