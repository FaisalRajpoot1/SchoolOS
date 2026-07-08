# SchoolOS — Improvements Backlog

Living list of concrete improvements per module, cross-cutting work, and
candidate new modules. Worked through in batches; each batch is built, then
audited by parallel senior-review agents (security / edge cases / perf / bad
practices), fixed, verified (typecheck · lint · test · build), and committed.

**Legend** — Priority: `P1` high · `P2` medium · `P3` nice-to-have.
Effort: `S` (<½ day) · `M` (~1 day) · `L` (multi-day). Type: `SEC` security ·
`BUG`/`PERF` · `FEAT` · `UX` · `TEST` · `DEBT` tech-debt.

Status: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## 0. Carried over from the last review (decisions pending)

| # | Item | Pri | Eff | Type |
|---|------|-----|-----|------|
| 0.1 | `[ ]` Attendance: scope TEACHER writes/reads to their assigned sections (currently any teacher, any section) | P1 | M | SEC |
| 0.2 | `[ ]` Homework/Assignments: only the owning teacher (or admin) may grade/delete submissions | P1 | M | SEC |
| 0.3 | `[x]` `/reports/finance` + `/ai/insights`: push per-student balance/aggregation to SQL instead of loading all rows in memory — batches 26-27 | P2 | M | PERF |
| 0.4 | `[ ]` Portal `childHomework`/`childAssignments`/`childResults`: add `schoolId` to the student `findUnique` (defense-in-depth; already ownership-checked + tenant-scoped downstream) | P3 | S | SEC |

**Done:** 0.1 (attendance teacher section-scoping), 0.2 (owner-only homework/assignment management), 1.5 (per-user AI rate limiting) — commit `d4257e6`. 1.11 (PDF service), Payslip PDF (M18), Certificate PDF + QR (M21) — batch 2 `b0d95d3`. 1.3 (toasts), 1.4 (Spinner/EmptyState primitives, partial rollout) — batch 3 `2151ad6`. N1 Student Portal — batch 4 `e7d2369`. Invoice PDF + Report-card PDF — batch 5.

---

## 1. Cross-cutting (platform-wide)

| # | Item | Pri | Eff | Type |
|---|------|-----|-----|------|
| 1.1 | `[ ]` Integration tests: `supertest` against a Postgres service container in CI (auth flow, tenant isolation, a couple of critical services) | P1 | L | TEST |
| 1.2 | `[ ]` Client tests: Vitest + Testing Library for key pages/hooks | P2 | M | TEST |
| 1.3 | `[x]` Global toast system (`lib/toast` store + `Toaster`); used for success/info feedback (errors stay inline to avoid double-reporting) | P1 | S | UX |
| 1.4 | `[~]` `Spinner` + `EmptyState` primitives created and applied to certificates/payslips lists; roll out to remaining list/detail pages incrementally | P2 | M | UX |
| 1.5 | `[ ]` Per-user rate limiting (keyGenerator on `req.user.id`) in addition to per-IP | P2 | S | SEC |
| 1.6 | `[x]` Audit-mutations middleware records every authenticated non-GET 2xx request (route pattern + params, no bodies) — batch 9 | P2 | M | SEC |
| 1.7 | `[ ]` OpenAPI/Swagger spec generated from Zod (`zod-to-openapi`) + Swagger UI | P2 | M | FEAT |
| 1.8 | `[ ]` Docker + docker-compose (Postgres + server + client) for one-command local run | P2 | M | DEBT |
| 1.9 | `[ ]` Background job queue (BullMQ/Redis) for emails, PDF generation, bulk jobs | P3 | L | DEBT |
| 1.10 | `[x]` File upload/storage service — pluggable `FileStorage` (`utils/fileStorage`) + multer upload middleware; local-disk backend (path-traversal-guarded), S3/GCS swappable without touching callers — batch 17 (documents) / 18 (photos) / 23 (attachments) | P2 | M | FEAT |
| 1.15 | `[ ]` Orphaned-blob GC: DB-level `onDelete: Cascade` (documents, photos, attachments) removes rows but not stored files; add a reaper job (or route deletes through the service) so blobs are cleaned up on parent delete | P3 | M | DEBT |
| 1.11 | `[x]` PDF generation service (pdfkit + qrcode; `utils/pdf.renderPdf`/`sendPdf`) — used by payslips + certificates | P1 | M | FEAT |
| 1.12 | `[ ]` Notification providers (email via Resend/SES, SMS, push) behind a provider interface | P2 | L | FEAT |
| 1.13 | `[ ]` Soft-delete / archival for core records instead of hard delete (recoverability + FK safety) | P3 | M | DEBT |
| 1.14 | `[ ]` Deployment configs: Dockerfiles + Render/Railway (server) + Vercel (client) + prod CORS/cookies | P2 | M | DEBT |

---

## 2. Per-module improvements

### Auth & Security (M1)
- `[x]` P2 · M · Two-factor auth (TOTP) + backup codes — batch 20: `/auth/2fa/*` (setup w/ QR, enable, disable via password, regenerate); two-step login (`{ twoFactorRequired }` → resubmit with a code, no tokens until verified); single-use SHA-256-hashed backup codes (atomic consume); bad 2FA codes count toward lockout; Security-page panel + login backup-code fallback.
- `[x]` P2 · S · Login lockout / backoff after N failed attempts per account — batch 19: per-account counter (atomic increment) + temporary lock (`MAX_FAILED_LOGINS`/`LOGIN_LOCKOUT_MINUTES`), `429` while locked, timing equalized (dummy bcrypt on the locked path), reset on success; pure `lockout` helpers + tests.
- `[ ]` P3 · S · 2FA follow-ups (batch 20 accepted risks): encrypt `totpSecret` at rest (needs an app/KMS key) and reject TOTP replay within the ±1 window (track last-used step). Both low-likelihood for this app.
- `[ ]` P3 · M · Email verification on account creation; password-strength meter on client.
- `[ ]` P3 · M · Google OAuth sign-in.

### School Setup (M2)
- `[x]` P2 · S · School logo/branding upload — batch 18: `/settings/logo` upload/serve/delete + logo panel on School Settings.
- `[ ]` P3 · L · Subscription/plan + billing per school; feature flags per plan.

### Students (M3)
- `[x]` P1 · M · Bulk CSV import with validation + dry-run preview (`POST /students/bulk-import`, class/section by name) — batch 6.
- `[x]` P2 · S · Student photo upload — batch 18: `/students/:id/photo` upload/serve/delete (image-only, inline), avatars in list + upload panel on detail; shared `Avatar`/`useObjectUrl`.
- `[x]` P2 · M · Class promotion / year rollover — `POST /students/promote` (move active cohort to a class, or graduate) — batch 7.
- `[ ]` P3 · S · ID-card generation (needs 1.11).

### Students (M3) — follow-ups
- `[ ]` P3 · S · Photo thumbnails / batch avatar endpoint for lists (avatars currently fetch one blob per row; a client object-URL cache dedups remounts — batch 18 — but first render is still N requests).

### Teachers (M4)
- `[x]` P2 · S · Photo + qualification/document attachments — batch 21: teacher photo (upload/serve/delete, avatars, `PhotoPanel`); batch 31: teacher-owned documents — `Document.teacherId` owner added (at most one of student/employee/teacher), assert + tenant scoping, Documents page owner-type toggle (School/Student/Teacher).
- `[x]` P3 · S · Per-teacher workload view (periods, subjects, sections) — batch 37: `GET /timetable/workload` aggregates every active teacher's weekly load (periods, teaching minutes, distinct subjects & sections; 0-load teachers included so admins can spot imbalance) + a "Teacher workload" view mode on the Timetable page. Read-only, no schema change.

### Attendance (M6)
- `[ ]` P1 · M · Teacher section-scoping (0.1).
- `[x]` P2 · S · Monthly attendance summary (`GET /attendance/summary`) + CSV export — batch 10.
- `[x]` P2 · S · Auto-notify parents on absence — batch 24: marking a student ABSENT (bulkMark) fans a best-effort in-app notification to the student + their linked parents (via the N3 Notifications Center). Email/SMS delivery still needs 1.12.
- `[ ]` P3 · M · Period-wise attendance (vs day-level).

### Academics (M8)
- `[ ]` P3 · M · Electives / subject groups / streams.
- `[ ]` P3 · S · Syllabus/curriculum document per subject (needs 1.10).

### Timetable (M9)
- `[ ]` P3 · L · Auto-generation (constraint solver) from teacher availability + rooms.
- `[x]` P2 · S · Printable / exportable timetable per section & teacher. — batch 12: `GET /timetable/slots/export` renders a per-section or per-teacher weekly PDF (pure `groupTimetable` + `buildTimetablePdf`, tenant-scoped, page-break-aware with repeated headers) + "Download PDF" button + unit tests.

### Fees (M7)
- `[ ]` P1 · L · Online payment gateway (Stripe/Razorpay) + webhook reconciliation.
- `[x]` P1 · S · Invoice / fee-statement PDF (`GET /invoices/:id/pdf`) — batch 5.
- `[x]` P2 · M · Fee plans / installment schedules + auto late-fee — batch 38: installment schedules done. `InvoiceInstallment` model + `GET/PUT/DELETE /invoices/:id/installments`; a plan splits the net payable into dated installments (amounts must sum to net total), and recorded payments are allocated in `seq` order (pure `allocateInstallments`, unit-tested) to derive each installment's status (PAID/PARTIAL/OVERDUE/UPCOMING). Invoice-detail "Installment plan" card with an equal-monthly generator + manual editor. Batch 39: auto late-fee — `Invoice.lateFee` column + `POST /invoices/apply-late-fees` (flat fee to every overdue, still-owing invoice past `dueDate + graceDays` that doesn't already carry one; idempotent). Net owed becomes `max(0, subtotal − discount) + lateFee` across totals, the PDF, and the reports/dashboard/AI finance aggregations; "Apply late fees" action on the invoices list.
- `[x]` P2 · S · Scholarships / structured discounts — batch 32: `Invoice.discount` field; net owed = subtotal − discount (floored at 0); status/balance/payment-guard derive from net; PDF + create form + detail show the breakdown; finance aggregations (reports, dashboard, AI-insights) net out the discount. discount=0 path is fully backward-compatible.

### Exams (M12)
- `[x]` P1 · M · Report-card PDF (`GET /exams/:id/report-card/:studentId/pdf`, class-scoped) — batch 5. Batch 36: added "Class position: N of M" — dense rank of the student's obtained total among all active classmates (reuses the `results()` ranking; PDF-only, no schema/client change).
- `[x]` P2 · M · Per-school configurable grade scheme — batch 22: `GradeBand` model + `GET/PUT/DELETE /exams/grade-scheme` (falls back to the default A+…F scale when unset); pure `gradeForBands` (highest-floor-wins) drives exam results + report cards; admin Grade Scheme editor page + nav.
- `[ ]` P3 · M · GPA/CGPA, weighted terms, co-scholastic areas.

### Homework (M10) / Assignments (M11)
- `[ ]` P1 · M · Owner-only grading (0.2).
- `[~]` P2 · M · Real file attachments for tasks & submissions — batch 23: task attachments (`Attachment` model + shared attachments store/controller reused across both modules; `/{homework,assignments}/:id/attachments` upload/list/download/delete; owning-teacher-or-admin to write, any admin/teacher to read; image+doc allow-list, server-derived MIME, tenant+owner scoped). Submission-file uploads still open.

### Library (M13)
- `[ ]` P3 · M · Reservations/holds + barcode lookup.
- `[x]` P2 · S · Overdue notifications — batch 28: admin/librarian-triggered `POST /library/issues/remind-overdue` sends a best-effort in-app reminder to each borrower (+ guardians) with currently-overdue books; "Remind overdue" button on the issues page. Email/SMS still needs 1.12.

### Transport (M14)
- `[ ]` P3 · L · Live GPS tracking + parent ETA.
- `[ ]` P3 · M · Route optimization.

### Hostel (M15)
- `[ ]` P3 · M · Mess/meal plans; leave/outing passes; visitor log.

### Inventory (M16)
- `[ ]` P3 · M · Purchase orders + stock valuation report.
- `[ ]` P3 · S · Barcode / asset tagging.

### HR (M17)
- `[ ]` P3 · M · Staff attendance/biometric; appraisals; document vault.

### Payroll (M18)
- `[ ]` P1 · S · PDF payslip (needs 1.11).
- `[~]` P2 · M · Bank-transfer export file (CSV/NACHA); configurable tax slabs; YTD summary. — batch 29: per-period payroll register CSV export. Batch 33: configurable progressive tax slabs. Batch 34: YTD summary. Batch 35: employee bank fields (HR form/detail) + bank-transfer CSV (`GET /payroll/bank-file` — account name/no, bank, routing, net amount; skips employees without an account).

### Parent Portal (M5)
- `[ ]` P1 · M · Online fee payment from portal (needs Fees gateway).
- `[ ]` P2 · M · Parent↔teacher messaging; PTM booking.

### Communication (M19)
- `[ ]` P2 · L · Real email/SMS/push delivery + templates + delivery status (needs 1.12).

### Events (M20)
- `[~]` P3 · S · RSVP + iCal export + reminders. — iCal (`.ics`) per-event export done (batch 11); RSVP done (batch 13): `EventRsvp` model + migration, audience-scoped `GET/PUT/DELETE /events/:id/rsvp` (own response + counts), admin `GET /events/:id/rsvps` attendee list, pure `summarizeRsvps` + unit tests, RSVP buttons with counts on the calendar page. Reminders still open.

### Notifications (N3)
- `[ ]` P2 · M · Move notification fan-out off the request hot path to a background job/queue (currently synchronous `createMany`, capped at 5000 recipients per publish with a logged overflow warning — see `notifications.service.ts`). Add redelivery/reconciliation since fan-out is best-effort.
- `[ ]` P3 · M · Real delivery channels (email/SMS/push) behind the same `notify*` producers; more producers (events, attendance, fees).

### Certificates (M21)
- `[ ]` P1 · M · PDF certificate with embedded QR to the verify URL (needs 1.11).
- `[ ]` P3 · M · Admin template editor.

### Reports (M22)
- `[~]` P2 · M · SQL-side aggregation (0.3) + more report types. — batch 26: `/reports/finance` top-10 defaulters now aggregated in SQL (`$queryRaw`, payments summed per invoice to avoid join fan-out) instead of loading every invoice+payment into memory; `/ai/insights` still to do.
- `[ ]` P3 · M · Scheduled report emails; PDF/Excel export.

### Dashboard (M23)
- `[ ]` P2 · M · Role-specific dashboards (teacher, parent, accountant).
- `[ ]` P3 · S · Date-range filter + drill-down.

### Settings (M24)
- `[ ]` P2 · L · Granular roles/permissions editor (fine-grained RBAC beyond fixed roles).
- `[ ]` P3 · M · Theme customization; backup/restore; API-key scopes + usage metrics; outbound webhooks.

### AI Assistant (M25)
- `[~]` P2 · M · SQL-side insights aggregation (0.3) + response streaming. — batch 27: at-risk fail-count + outstanding-balance now aggregated in SQL (`$queryRaw`) instead of loading all marks/invoices. Response streaming still open.
- `[ ]` P3 · M · More generators (lesson plans, feedback drafts); parent/school chatbot; result caching; per-tenant model config.

---

## 3. Candidate NEW modules

| # | Module | Pri | Eff | Notes |
|---|--------|-----|-----|-------|
| N1 | `[x]` **Student Portal** — student login (Student.userId), admin provisioning (`POST /students/:id/portal-access`), `/student-portal/*` own-data endpoints, client portal page + STUDENT dashboard/nav; shared `portalData` helpers deduped with parent portal | P1 | M | Done — batch 4 |
| N2 | `[x]` **Online Admissions / Enquiry** — public `/apply/:schoolId` form → admin pipeline (status flow) → convert-to-student. `AdmissionApplication` model, public+admin endpoints. Done — batch 8 |
| N3 | `[~]` **Notifications Center** (in-app inbox + unified delivery across email/SMS/push) — batch 16: `Notification` model + migration; `/notifications` own-inbox + reusable `notify*` producers; announcement publish fans out to the audience. Batches 24-25, 28, 30 added guardian producers (`notifyGuardiansSafe`/`notifySectionGuardiansSafe`) wired to attendance-absence, new homework/assignment, behaviour records, new fee invoices, fee payments received, and library-overdue reminders. In-app inbox done; email/SMS/push delivery channels still open. | P2 | M | Mostly done — batches 16, 24 |
| N4 | `[x]` **Document Management** (secure per-student/staff document store) — batch 17: `Document` model + migration; pluggable `FileStorage` (local-disk backend, path-traversal-guarded) + multer upload (size/extension limits); `/documents` admin-only upload/list/download/delete, tenant-scoped, student/employee/school-level ownership; server-generated storage keys + sanitized download filenames; pure `safeExtension`/`buildStorageKey`/`safeDownloadName` + tests; admin Documents page (upload w/ student attach, filter, download, delete). | P2 | M | Done — batch 17 (local storage; S3/GCS backend pluggable) |
| N5 | `[~]` **Health / Medical records** (infirmary visits, allergies, vaccinations) — batch 15: `MedicalProfile` (1:1) + `InfirmaryVisit` models + migration; `/medical` admin-only endpoints (profile upsert w/ derived BMI, visit CRUD); pure `bmi` helper + tests; admin Medical page (student picker → profile editor + visit log). Vaccination records still open. | P3 | M | Mostly done — batch 15 |
| N6 | `[x]` **Disciplinary / Behavior records** (incidents, merits/demerits) — batch 14: `BehaviorRecord` model + migration, `/behavior` CRUD + `/behavior/students/:id/summary` (merits/demerits/incidents/netPoints), signed-points rule (merit ≥ 0, demerit ≤ 0), pure `summarizeBehavior` + unit tests, admin Behaviour page (add/filter/delete) + nav. | P3 | S | Done — batch 14 |
| N7 | `[ ]` **Visitor / Gate management** | P3 | S | |
| N8 | `[ ]` **LMS / Online classes** (content, video links, quizzes) | P3 | L | Large; own initiative |
| N9 | `[ ]` **Analytics / BI** (cross-module KPI trends over time) | P3 | M | Extends Reports |
| N10 | `[ ]` **i18n / multi-language** support | P3 | M | Cross-cutting client work |

---

## 4. Suggested first batch (recommended order)

1. **Security & correctness hardening** — 0.1 teacher attendance scoping, 0.2 homework/assignment owner-grading, 1.5 per-user rate limiting. (P1, low risk, closes the review's open items.)
2. **PDF service + first consumers** — 1.11 then Payslip PDF (M18) and Certificate PDF+QR (M21). (High visible value.)
3. **Client UX** — 1.3 global toasts + 1.4 loading/empty states.
4. **New module: Student Portal (N1)** — rounds out the portal story.

Then iterate down the P1/P2 lists.
