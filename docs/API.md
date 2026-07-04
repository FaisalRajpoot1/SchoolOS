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
| POST   | `/auth/login`    | —      | Login (email + password + schoolId, optional `totpCode`/`backupCode`). After `MAX_FAILED_LOGINS` (default 5) wrong passwords the account locks for `LOGIN_LOCKOUT_MINUTES` (default 15) → `429`. When 2FA is enabled, a correct password with no code returns `{ twoFactorRequired: true }` (no tokens) and the client resubmits with a code |
| GET    | `/auth/2fa`      | Bearer | 2FA status (`enabled`, `backupCodesRemaining`) |
| POST   | `/auth/2fa/setup` | Bearer | Begin TOTP setup → `{ secret, otpauthUrl, qrDataUrl }` (pending until enabled) |
| POST   | `/auth/2fa/enable` | Bearer | Confirm setup with a `code`, enable 2FA → `{ backupCodes }` (shown once) |
| POST   | `/auth/2fa/disable` | Bearer | Disable 2FA (requires the account `password`) |
| POST   | `/auth/2fa/backup-codes` | Bearer | Regenerate backup codes (requires a current `code`) |
| POST   | `/auth/refresh`  | cookie | Rotate refresh token, issue access token |
| POST   | `/auth/logout`   | cookie | Revoke refresh token                     |
| GET    | `/auth/me`       | Bearer | Current user profile                     |
| POST   | `/auth/forgot-password` | —      | Request a reset token (no enumeration; returns the token in non-prod) |
| POST   | `/auth/reset-password`  | —      | Consume a reset token, set a new password, revoke all sessions |
| POST   | `/auth/change-password` | Bearer | Change password (keeps current session, revokes others) |
| GET    | `/auth/sessions` | Bearer | List active sessions (device/IP/last-used, current flagged) |
| DELETE | `/auth/sessions/:sessionId` | Bearer | Revoke one session |
| POST   | `/auth/sessions/revoke-others` | Bearer | Revoke all sessions except the current |

## Audit Logs — Module 1 (roles `SCHOOL_ADMIN` + `SUPER_ADMIN`, tenant-scoped; super admin sees all)

| Method | Path          | Description                                                |
| ------ | ------------- | ---------------------------------------------------------- |
| GET    | `/audit-logs` | List audit events (`page`, `limit`, `action`, `userId`)    |

Beyond the semantic `auth.*` events, **every authenticated mutation** (non-GET, 2xx) is recorded automatically by a middleware — the `action` is `METHOD /api/v1/<route pattern>` and the metadata carries the path params. Request bodies are never logged.

`POST /students/bulk-import` (`{ rows[], dryRun }`, role `SCHOOL_ADMIN`) validates and (unless `dryRun`) creates a batch of up to 500 students; class/section are matched by name within the tenant and each row succeeds or fails independently (per-row results returned).

`POST /students/promote` (`{ fromClassId, toClassId?, toSectionId?, graduate }`, role `SCHOOL_ADMIN`) moves all ACTIVE students of `fromClassId` to a target class (optional section) via an atomic `updateMany`, or — with `graduate: true` — marks them `GRADUATED`. Returns `{ moved, graduated }`.

Users are provisioned by admins via the students/teachers/parents modules — there is no public self-registration. Auth events are recorded automatically: `auth.login`, `auth.logout`, `auth.password_reset_requested`, `auth.password_reset`, `auth.password_changed`, `auth.session_revoked`, `auth.sessions_revoked_others`.

## Parents — Module 5 admin (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                              | Description                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| POST   | `/parents`                        | Create a parent + PARENT login, link children        |
| GET    | `/parents`                        | List parents (`page`, `limit`, `search`)             |
| GET    | `/parents/:id`                    | Parent detail (login + linked children)              |
| PATCH  | `/parents/:id`                    | Update profile (name change syncs login)             |
| DELETE | `/parents/:id`                    | Delete parent (cascades login account)               |
| POST   | `/parents/:id/children`           | Link a child (`{ studentId, relation? }`)            |
| DELETE | `/parents/:id/children/:studentId`| Unlink a child                                       |

## Parent Portal — Module 5 (role `PARENT`, own children only)

| Method | Path                                          | Description                                        |
| ------ | --------------------------------------------- | -------------------------------------------------- |
| GET    | `/portal/me`                                  | Parent profile + children                          |
| GET    | `/portal/children/:studentId/attendance`      | Child attendance history + counts (`from`, `to`)   |
| GET    | `/portal/children/:studentId/invoices`        | Child invoices with balances                       |
| GET    | `/portal/children/:studentId/homework`        | Child homework + submission status                 |
| GET    | `/portal/children/:studentId/results`         | Child published exam results (per-exam grade)      |

Every portal route verifies the student is linked to the calling parent (403 otherwise).

Admins provision a student's own login via `POST /students/:id/portal-access` (`{ email, password }`, role `SCHOOL_ADMIN`), which creates/resets a `STUDENT` account linked to the student.

## Student Portal — Module 5b (role `STUDENT`, own data only)

The student resolves from their login (`Student.userId`); no id is accepted, so a student can only ever read their own records.

| Method | Path                        | Description                                     |
| ------ | --------------------------- | ----------------------------------------------- |
| GET    | `/student-portal/me`        | Own profile + class/section                     |
| GET    | `/student-portal/attendance`| Own attendance history + counts (`from`, `to`)  |
| GET    | `/student-portal/invoices`  | Own invoices with balances                      |
| GET    | `/student-portal/homework`  | Own section homework + submission status        |
| GET    | `/student-portal/assignments`| Own section assignments + submission status    |
| GET    | `/student-portal/results`   | Own published exam results (per-exam grade)     |

## Admissions — Module N2

Public application funnel + admin pipeline. The public endpoints sit before the auth guard; the apply form is rate-limited.

| Method | Path                          | Auth         | Description                                                    |
| ------ | ----------------------------- | ------------ | ------------------------------------------------------------- |
| GET    | `/admissions/schools/:schoolId` | public     | Minimal `{ id, name }` for an active school (drives the form) |
| POST   | `/admissions/apply`           | public       | Submit an enquiry (`{ schoolId, applicant…, guardian… }`)     |
| GET    | `/admissions`                 | SCHOOL_ADMIN | List applications (`status` filter, paginated)               |
| GET    | `/admissions/:id`             | SCHOOL_ADMIN | Application detail                                            |
| PATCH  | `/admissions/:id/status`      | SCHOOL_ADMIN | Set status (SUBMITTED / REVIEWING / ACCEPTED / REJECTED)      |
| POST   | `/admissions/:id/convert`     | SCHOOL_ADMIN | Convert to an enrolled student (optional `classId`/`sectionId`); marks CONVERTED |
| DELETE | `/admissions/:id`             | SCHOOL_ADMIN | Delete an application                                        |

Public apply page: `/apply/:schoolId` (client route). Statuses: `SUBMITTED`, `REVIEWING`, `ACCEPTED`, `REJECTED`, `CONVERTED`.

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

## Academic Management — Module 8 (role `SCHOOL_ADMIN`, tenant-scoped)

Subjects (catalog):

| Method | Path            | Description            |
| ------ | --------------- | ---------------------- |
| POST   | `/subjects`     | Create a subject       |
| GET    | `/subjects`     | List subjects          |
| PATCH  | `/subjects/:id` | Update a subject       |
| DELETE | `/subjects/:id` | Delete a subject       |

Classes, sections, and offered subjects:

| Method | Path                                   | Description                              |
| ------ | -------------------------------------- | ---------------------------------------- |
| POST   | `/classes`                             | Create a class                           |
| GET    | `/classes`                             | List classes (with section/subject counts) |
| GET    | `/classes/:classId`                    | Class detail (sections + offered subjects) |
| PATCH  | `/classes/:classId`                    | Update a class                           |
| DELETE | `/classes/:classId`                    | Delete a class                           |
| POST   | `/classes/:classId/sections`           | Add a section                            |
| PATCH  | `/classes/:classId/sections/:sectionId`| Update a section                         |
| DELETE | `/classes/:classId/sections/:sectionId`| Delete a section                         |
| PUT    | `/classes/:classId/subjects`           | Replace the class's offered subjects (`{ subjectIds }`) |

## Student Management — Module 3 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                              | Description                                          |
| ------ | --------------------------------- | ---------------------------------------------------- |
| POST   | `/students`                       | Admit a student (auto admission # if omitted; optional guardians + enrollment) |
| GET    | `/students`                       | List students (`page`, `limit`, `search`, `classId`, `sectionId`, `status`) |
| GET    | `/students/:id`                   | Student detail (guardians + class/section)           |
| PATCH  | `/students/:id`                   | Update profile / enrollment                          |
| PATCH  | `/students/:id/status`            | Change status (ACTIVE/INACTIVE/GRADUATED/TRANSFERRED/ALUMNI) |
| DELETE | `/students/:id`                   | Delete a student                                     |
| POST   | `/students/:id/guardians`         | Add a guardian                                       |
| PATCH  | `/students/:id/guardians/:guardianId` | Update a guardian                                |
| DELETE | `/students/:id/guardians/:guardianId` | Remove a guardian                                |

## Teacher Management — Module 4 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                  | Description                                                     |
| ------ | --------------------- | -------------------------------------------------------------- |
| POST   | `/teachers`           | Create a teacher + linked TEACHER login account (auto employee #) |
| GET    | `/teachers`           | List teachers (`page`, `limit`, `search`, `status`)            |
| GET    | `/teachers/:id`       | Teacher detail (login, class-teacher sections, subject assignments) |
| PATCH  | `/teachers/:id`       | Update profile (name change syncs the login account)           |
| PATCH  | `/teachers/:id/status`| Change status (ACTIVE/INACTIVE/ON_LEAVE/TERMINATED); non-active disables login |
| DELETE | `/teachers/:id`       | Delete teacher + login account                                 |

Assignments (in the Classes module):

| Method | Path                                            | Description                          |
| ------ | ----------------------------------------------- | ------------------------------------ |
| PATCH  | `/classes/:classId/sections/:sectionId`         | Set/clear class teacher via `classTeacherId` |
| PUT    | `/classes/:classId/subjects/:subjectId/teacher` | Set/clear subject teacher (`{ teacherId }`)  |

## Attendance — Module 6 (roles `SCHOOL_ADMIN` + `TEACHER`, tenant-scoped)

| Method | Path                            | Description                                                  |
| ------ | ------------------------------- | ------------------------------------------------------------ |
| GET    | `/attendance`                   | Roster for a section/date (`sectionId`, `date`) — each active student + recorded status |
| POST   | `/attendance`                   | Bulk mark/update a section/date (`{ sectionId, date, records:[{ studentId, status, remark? }] }`); upserts |
| GET    | `/attendance/students/:studentId` | A student's records over a range (`from`, `to`) with per-status counts |
| GET    | `/attendance/summary`           | Per-student monthly totals for a section (`sectionId`, `month`, `year`) + present-rate |

Attendance statuses: `PRESENT`, `ABSENT`, `LATE`, `LEAVE`.

## Fee Management — Module 7 (roles `SCHOOL_ADMIN` + `ACCOUNTANT`, tenant-scoped)

Fee categories:

| Method | Path                  | Description           |
| ------ | --------------------- | --------------------- |
| POST   | `/fee-categories`     | Create a fee category |
| GET    | `/fee-categories`     | List fee categories   |
| PATCH  | `/fee-categories/:id` | Update a fee category |
| DELETE | `/fee-categories/:id` | Delete a fee category |

Invoices & payments (amounts are whole units of the school's currency; line-item amounts may be negative for discounts/scholarships):

| Method | Path                                | Description                                                  |
| ------ | ----------------------------------- | ------------------------------------------------------------ |
| POST   | `/invoices`                         | Create an invoice with line items (auto invoice #)           |
| GET    | `/invoices`                         | List invoices (`page`, `limit`, `search`, `status`, `studentId`); each row carries `totals` |
| GET    | `/invoices/:id`                     | Invoice detail (items, payments, `totals: {total,paid,balance}`) |
| GET    | `/invoices/:id/pdf`                 | Download the invoice / fee statement as a PDF                |
| PATCH  | `/invoices/:id`                     | Update title/dueDate/notes                                   |
| POST   | `/invoices/:id/cancel`              | Cancel an invoice                                            |
| DELETE | `/invoices/:id`                     | Delete an invoice                                            |
| POST   | `/invoices/:id/payments`            | Record a payment (recomputes status PENDING/PARTIAL/PAID)    |
| DELETE | `/invoices/:id/payments/:paymentId` | Remove a payment (recomputes status)                        |
| GET    | `/invoices/:id/installments`        | Installment plan + each installment's derived status (payments allocated in `seq` order) |
| PUT    | `/invoices/:id/installments`        | Replace the plan (amounts must sum to the net total; `seq` from submitted order) |
| DELETE | `/invoices/:id/installments`        | Remove the installment plan                                 |

Invoice statuses: `PENDING`, `PARTIAL`, `PAID`, `CANCELLED`. Payment methods: `CASH`, `CARD`, `BANK_TRANSFER`, `ONLINE`, `OTHER`.

## Dashboard — Module 23 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path         | Description                                                            |
| ------ | ------------ | --------------------------------------------------------------------- |
| GET    | `/dashboard` | Aggregated KPIs: student/teacher/class/section counts, today's attendance breakdown + rate, finance (invoiced/collected/outstanding + invoices by status), and recent invoices |

## Examination — Module 12 (tenant-scoped)

Exam management is `SCHOOL_ADMIN`; marks entry and results are `SCHOOL_ADMIN` + `TEACHER`.

| Method | Path                                       | Description                                                       |
| ------ | ------------------------------------------ | ----------------------------------------------------------------- |
| GET    | `/exams/grade-scheme`                      | The school's grade bands (`{ bands, isDefault }`; default A+…F when unset) — admin/teacher |
| PUT    | `/exams/grade-scheme`                      | Replace the grade scheme (`{ bands:[{ label, minPercentage }] }`; unique labels, distinct mins, one band must start at 0%) — admin |
| DELETE | `/exams/grade-scheme`                      | Reset to the built-in default scale — admin                       |
| POST   | `/exams`                                   | Create an exam (auto-populates subjects from the class's offered subjects) |
| GET    | `/exams`                                   | List exams (`page`, `limit`, `search`, `classId`, `status`)        |
| GET    | `/exams/:id`                               | Exam detail (subjects with scheme + marks counts)                 |
| PATCH  | `/exams/:id`                               | Update name/dates                                                 |
| POST   | `/exams/:id/publish` · `/unpublish`        | Toggle published status                                           |
| DELETE | `/exams/:id`                               | Delete an exam                                                    |
| PATCH  | `/exams/:id/subjects/:examSubjectId`       | Update marking scheme (`maxMarks`, `passMarks`, `examDate`)        |
| GET    | `/exams/:id/subjects/:examSubjectId/marks` | Marks roster for one subject                                      |
| POST   | `/exams/:id/subjects/:examSubjectId/marks` | Bulk upsert marks (`{ records:[{ studentId, marksObtained?, isAbsent?, remark? }] }`) |
| GET    | `/exams/:id/results`                       | Ranked results: per-student totals, percentage, grade, pass/fail  |
| GET    | `/exams/:id/report-card/:studentId/pdf`    | Download a student's report card for the exam as a PDF (admin/teacher) |

Grade scale: A+ ≥90, A ≥80, B ≥70, C ≥60, D ≥50, E ≥40, else F.

## Homework — Module 10 (roles `SCHOOL_ADMIN` + `TEACHER`, tenant-scoped)

| Method | Path                                       | Description                                                     |
| ------ | ------------------------------------------ | --------------------------------------------------------------- |
| POST   | `/homework`                                | Create homework for a section (author teacher resolved from the caller) |
| GET    | `/homework`                                | List homework (`page`, `limit`, `search`, `classId`, `sectionId`, `subjectId`) |
| GET    | `/homework/:id`                            | Homework detail + submission count                              |
| PATCH  | `/homework/:id`                            | Update title/description/dueDate/attachment/subject            |
| DELETE | `/homework/:id`                            | Delete homework                                                 |
| GET    | `/homework/:id/attachments`                | List task attachments (any admin/teacher)                      |
| POST   | `/homework/:id/attachments`                | Upload an attachment (`file`; owning teacher or admin)         |
| GET    | `/homework/:id/attachments/:attachmentId`  | Download an attachment                                          |
| DELETE | `/homework/:id/attachments/:attachmentId`  | Remove an attachment (owning teacher or admin)                 |
| GET    | `/homework/:id/submissions`                | Section roster with each student's submission (or null)        |
| PUT    | `/homework/:id/submissions/:studentId`     | Record/update a submission (computes `isLate` vs due date)     |
| PATCH  | `/homework/:id/submissions/:studentId/grade` | Add feedback + marks                                          |
| DELETE | `/homework/:id/submissions/:studentId`     | Remove a submission                                            |

## Assignments — Module 11 (roles `SCHOOL_ADMIN` + `TEACHER`, tenant-scoped)

Like homework, but graded out of `maxMarks` with an optional rubric.

| Method | Path                                          | Description                                                     |
| ------ | --------------------------------------------- | --------------------------------------------------------------- |
| POST   | `/assignments`                                | Create an assignment (optional `criteria: [{ label, maxPoints }]`) |
| GET    | `/assignments`                                | List (`page`, `limit`, `search`, `classId`, `sectionId`, `subjectId`) |
| GET    | `/assignments/:id`                            | Detail (rubric criteria + submission count)                    |
| PATCH  | `/assignments/:id`                            | Update title/instructions/maxMarks/dueDate/attachment/subject  |
| DELETE | `/assignments/:id`                            | Delete assignment                                              |
| GET    | `/assignments/:id/attachments`                | List task attachments (any admin/teacher)                      |
| POST   | `/assignments/:id/attachments`                | Upload an attachment (`file`; owning teacher or admin)         |
| GET    | `/assignments/:id/attachments/:attachmentId`  | Download an attachment                                          |
| DELETE | `/assignments/:id/attachments/:attachmentId`  | Remove an attachment (owning teacher or admin)                 |
| GET    | `/assignments/:id/submissions`                | Section roster + each student's submission                     |
| PUT    | `/assignments/:id/submissions/:studentId`     | Record/update a submission (computes `isLate`)                  |
| PATCH  | `/assignments/:id/submissions/:studentId/grade` | Grade (`marks` ≤ maxMarks, `feedback`)                       |
| DELETE | `/assignments/:id/submissions/:studentId`     | Remove a submission                                            |

Parent portal gains `GET /portal/children/:studentId/assignments` (child's assignments + submission status).

## Timetable — Module 9 (tenant-scoped)

Weekly recurring slots per section. Viewing is `SCHOOL_ADMIN` + `TEACHER`; editing is `SCHOOL_ADMIN`. Times are minutes from midnight; `dayOfWeek` is `MON`–`SUN`.

| Method | Path                    | Description                                                          |
| ------ | ----------------------- | ------------------------------------------------------------------- |
| GET    | `/timetable/slots`      | Weekly slots for a `sectionId` **or** `teacherId`                    |
| GET    | `/timetable/workload`   | Per-teacher weekly load: periods, teaching minutes, distinct subjects & sections (every active teacher, 0-load included) |
| GET    | `/timetable/slots/export` | Download the section/teacher weekly timetable as a PDF (`SCHOOL_ADMIN` + `TEACHER`) |
| POST   | `/timetable/slots`      | Add a slot (rejects section/teacher/room clashes on the same day)   |
| PATCH  | `/timetable/slots/:id`  | Update a slot (re-checks clashes)                                    |
| DELETE | `/timetable/slots/:id`  | Delete a slot                                                       |

Conflict detection: two slots overlap when `existing.start < new.end AND existing.end > new.start` on the same day — enforced for the section, the assigned teacher (across all sections), and the room.

## Library — Module 13 (roles `SCHOOL_ADMIN` + `LIBRARIAN`, tenant-scoped)

| Method | Path                              | Description                                                    |
| ------ | --------------------------------- | -------------------------------------------------------------- |
| POST   | `/library/categories`             | Create a book category                                         |
| GET    | `/library/categories`             | List categories                                                |
| PATCH  | `/library/categories/:id`         | Rename a category                                              |
| DELETE | `/library/categories/:id`         | Delete a category                                              |
| POST   | `/library/books`                  | Add a book (sets available = total copies)                     |
| GET    | `/library/books`                  | Search/list (`page`, `limit`, `search` title/author/ISBN, `categoryId`, `available`) |
| GET    | `/library/books/:id`              | Book detail + currently-issued copies                          |
| PATCH  | `/library/books/:id`              | Update (copy delta adjusts availability)                       |
| DELETE | `/library/books/:id`              | Delete a book                                                  |
| POST   | `/library/books/:id/issue`        | Issue a copy (`{ studentId, dueDate }`; decrements availability) |
| POST   | `/library/issues/remind-overdue`  | Notify each borrower (+ guardians) with currently-overdue books; returns `{ overdue, notified }` |
| POST   | `/library/issues/:issueId/return` | Return (computes late fine, restores a copy)                   |
| GET    | `/library/issues`                 | List issues (`page`, `limit`, `status`, `studentId`, `bookId`) |

Late fine = days past due × the per-day rate (config constant).

## Transport — Module 14 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                                   | Description                                             |
| ------ | -------------------------------------- | ------------------------------------------------------- |
| POST   | `/transport/vehicles`                  | Add a vehicle (unique registration per school)          |
| GET    | `/transport/vehicles`                  | List vehicles                                           |
| PATCH  | `/transport/vehicles/:id`              | Update a vehicle                                        |
| DELETE | `/transport/vehicles/:id`              | Delete a vehicle                                        |
| POST   | `/transport/routes`                    | Create a route (optional `vehicleId`, `fee`, nested `stops`) |
| GET    | `/transport/routes`                    | List routes (vehicle + stop/rider counts)               |
| GET    | `/transport/routes/:id`                | Route detail (stops + allocations)                      |
| PATCH  | `/transport/routes/:id`                | Update a route                                          |
| DELETE | `/transport/routes/:id`                | Delete a route                                          |
| POST   | `/transport/routes/:id/stops`          | Add a stop                                              |
| DELETE | `/transport/routes/:id/stops/:stopId`  | Remove a stop                                           |
| GET    | `/transport/allocations`               | List allocations (`routeId` filter)                     |
| PUT    | `/transport/allocations/:studentId`    | Assign/reassign a student to a route + stop (one per student) |
| DELETE | `/transport/allocations/:studentId`    | Unallocate a student                                    |

## Communication — Module 19 (tenant-scoped)

Notice-board announcements targeted by audience. The feed is readable by any authenticated user; management is `SCHOOL_ADMIN`.

| Method | Path                  | Auth          | Description                                              |
| ------ | --------------------- | ------------- | ------------------------------------------------------- |
| GET    | `/announcements/feed` | any           | Active announcements for the caller's role (pinned first) |
| POST   | `/announcements`      | SCHOOL_ADMIN  | Post an announcement (`audience`, `pinned`, `expiresAt`) |
| GET    | `/announcements`      | SCHOOL_ADMIN  | Manage list (paginated)                                 |
| GET    | `/announcements/:id`  | SCHOOL_ADMIN  | Get one                                                 |
| PATCH  | `/announcements/:id`  | SCHOOL_ADMIN  | Update                                                  |
| DELETE | `/announcements/:id`  | SCHOOL_ADMIN  | Delete                                                  |

Audiences: `ALL`, `TEACHERS`, `STUDENTS`, `PARENTS`, `STAFF`. The feed matches `ALL` plus the audience(s) mapped to the caller's role, excludes expired/future-dated items, and orders pinned first. (Email/SMS/WhatsApp/push channels are deferred — require external providers.)

## Hostel — Module 15 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                              | Description                                                  |
| ------ | --------------------------------- | ------------------------------------------------------------ |
| POST   | `/hostels`                        | Create a hostel (`type` BOYS/GIRLS/MIXED, warden, monthly fee) |
| GET    | `/hostels`                        | List hostels (room count, total beds, occupancy)             |
| GET    | `/hostels/:id`                    | Hostel detail (rooms + allocations)                          |
| PATCH  | `/hostels/:id`                    | Update a hostel                                              |
| DELETE | `/hostels/:id`                    | Delete a hostel                                              |
| POST   | `/hostels/:id/rooms`              | Add a room (`roomNumber`, `floor`, `capacity`)               |
| PATCH  | `/hostels/:id/rooms/:roomId`      | Update a room (capacity ≥ current occupancy)                 |
| DELETE | `/hostels/:id/rooms/:roomId`      | Remove a room                                               |
| GET    | `/hostels/allocations`            | List allocations (`hostelId` / `roomId` filter)              |
| PUT    | `/hostels/allocations/:studentId` | Allocate/reallocate a student to a room (`{ roomId, bedLabel? }`; capacity-guarded, one per student) |
| DELETE | `/hostels/allocations/:studentId` | Deallocate a student                                         |

## Inventory — Module 16 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path                          | Description                                                       |
| ------ | ----------------------------- | ---------------------------------------------------------------- |
| POST   | `/inventory/suppliers`        | Add a supplier                                                   |
| GET    | `/inventory/suppliers`        | List suppliers (with item counts)                               |
| PATCH  | `/inventory/suppliers/:id`    | Update a supplier                                               |
| DELETE | `/inventory/suppliers/:id`    | Delete a supplier                                              |
| POST   | `/inventory/items`            | Add an item (opening `quantity` seeds an IN movement)           |
| GET    | `/inventory/items`            | List/search items (`search`, `supplierId`, `lowStock`)          |
| GET    | `/inventory/items/:id`        | Item detail + recent stock movements                            |
| PATCH  | `/inventory/items/:id`        | Update item metadata (quantity changes only via stock)          |
| DELETE | `/inventory/items/:id`        | Delete an item                                                 |
| POST   | `/inventory/items/:id/stock`  | Record a movement (`type` IN/OUT, `quantity`, `unitCost?`, `supplierId?`); adjusts quantity, guards OUT below zero |

`lowStock` filters items where `quantity ≤ reorderLevel` (column-to-column comparison).

## HR — Module 17 (roles `SCHOOL_ADMIN` + `HR`, tenant-scoped)

| Method | Path                          | Description                                                  |
| ------ | ----------------------------- | ------------------------------------------------------------ |
| POST   | `/hr/employees`               | Add an employee (auto `STF-` code if omitted)                |
| GET    | `/hr/employees`               | List employees (`page`, `limit`, `search`, `department`, `status`) |
| GET    | `/hr/employees/:id`           | Employee detail + leave history                              |
| PATCH  | `/hr/employees/:id`           | Update employee profile                                     |
| PATCH  | `/hr/employees/:id/status`    | Change status (ACTIVE/INACTIVE/ON_LEAVE/TERMINATED)         |
| DELETE | `/hr/employees/:id`           | Delete an employee                                          |
| POST   | `/hr/employees/:id/leave`     | Apply for leave (`type`, `startDate`, `endDate`, `reason?`) |
| GET    | `/hr/leave`                   | List leave requests (`status`, `employeeId`)                |
| PATCH  | `/hr/leave/:leaveId/status`   | Approve/reject a pending request                           |

Employment types: `FULL_TIME`, `PART_TIME`, `CONTRACT`. Leave types: `CASUAL`, `SICK`, `ANNUAL`, `UNPAID`.

## Payroll — Module 18 (roles `SCHOOL_ADMIN` + `HR`, tenant-scoped)

Payslips are one-per-employee-per-month. `netPay = basicSalary + allowances + bonus − deductions − tax`.

| Method | Path                              | Description                                                    |
| ------ | --------------------------------- | ------------------------------------------------------------- |
| POST   | `/payroll/payslips/generate`      | Bulk-create DRAFT payslips for active salaried employees missing one for `{ periodMonth, periodYear }` |
| POST   | `/payroll/payslips`               | Create one payslip (basic defaults to the employee's salary)  |
| GET    | `/payroll/payslips`               | List (`employeeId`, `periodMonth`, `periodYear`, `status`)     |
| GET    | `/payroll/register`               | Full-period register (`periodMonth`, `periodYear`) — all payslips + totals, for CSV export |
| GET    | `/payroll/ytd`                    | Year-to-date per-employee totals (`periodYear`) — sums each salary component across the year |
| GET    | `/payroll/bank-file`              | Bank-transfer rows for a period (`periodMonth`, `periodYear`) — account/bank/routing + net amount; skips employees with no account |
| GET    | `/payroll/tax-slabs`              | The school's progressive tax slabs (`{ slabs: [{ minMonthly, rate }] }`) |
| PUT    | `/payroll/tax-slabs`              | Replace the tax slabs (distinct floors; auto-applied on payslip generate) |
| GET    | `/payroll/payslips/:id`           | Payslip detail                                               |
| GET    | `/payroll/payslips/:id/pdf`       | Download the payslip as a PDF                                |
| PATCH  | `/payroll/payslips/:id`           | Edit amounts (DRAFT only; recomputes net)                    |
| POST   | `/payroll/payslips/:id/pay`       | Mark paid (sets `paidAt`)                                    |
| DELETE | `/payroll/payslips/:id`           | Delete a payslip                                            |

Statuses: `DRAFT`, `PAID`. (Payslip PDF export + bank-transfer files are deferred.)

## Events — Module 20 (tenant-scoped)

School calendar. The calendar feed is readable by any authenticated user (audience-filtered by role); management is `SCHOOL_ADMIN`.

| Method | Path                | Auth          | Description                                                     |
| ------ | ------------------- | ------------- | -------------------------------------------------------------- |
| GET    | `/events/calendar`  | any           | Events overlapping `[from, to]` (defaults to the next 60 days) for the caller's role |
| GET    | `/events/:id/ics`   | any           | Download one event as an iCalendar (`.ics`) file (audience-filtered by role) |
| GET    | `/events/:id/rsvp`  | any           | The caller's own RSVP status + aggregate counts (`going`/`maybe`/`notGoing`/`total`) |
| PUT    | `/events/:id/rsvp`  | any           | Set/replace the caller's RSVP (`status`: `GOING`/`MAYBE`/`NOT_GOING`) |
| DELETE | `/events/:id/rsvp`  | any           | Withdraw the caller's RSVP |
| GET    | `/events/:id/rsvps` | SCHOOL_ADMIN  | Full attendee list (name, role, status)                       |
| POST   | `/events`           | SCHOOL_ADMIN  | Create an event (`type`, `audience`, dates, `location`, `allDay`) |
| GET    | `/events`           | SCHOOL_ADMIN  | Manage list (paginated, `type` filter)                        |
| GET    | `/events/:id`       | SCHOOL_ADMIN  | Get one                                                        |
| PATCH  | `/events/:id`       | SCHOOL_ADMIN  | Update                                                         |
| DELETE | `/events/:id`       | SCHOOL_ADMIN  | Delete                                                        |

Event types: `GENERAL`, `HOLIDAY`, `EXAM`, `PTM`, `COMPETITION`, `SPORTS`. Audiences reuse the announcement set (`ALL`/`TEACHERS`/`STUDENTS`/`PARENTS`/`STAFF`).

## Certificates — Module 21 (tenant-scoped)

Management is `SCHOOL_ADMIN` + `RECEPTIONIST`; verification is **public** (for QR scanning).

| Method | Path                          | Auth                       | Description                                                    |
| ------ | ----------------------------- | -------------------------- | ------------------------------------------------------------- |
| GET    | `/certificates/verify/:code`  | public                     | Verify by code → `{ valid, certificate? }` (minimal info)     |
| POST   | `/certificates`               | SCHOOL_ADMIN / RECEPTIONIST | Issue (auto serial + verification code; body auto-generated from a template unless provided) |
| GET    | `/certificates`               | SCHOOL_ADMIN / RECEPTIONIST | List (`studentId`, `type`, `search`)                          |
| GET    | `/certificates/:id`           | SCHOOL_ADMIN / RECEPTIONIST | Certificate detail                                            |
| GET    | `/certificates/:id/pdf`       | SCHOOL_ADMIN / RECEPTIONIST | Download the certificate as a PDF (with a QR to the verify page) |
| DELETE | `/certificates/:id`           | SCHOOL_ADMIN / RECEPTIONIST | Delete                                                        |

Types: `BONAFIDE`, `CHARACTER`, `TRANSFER`, `LEAVING`. Each issued certificate carries a unique `verificationCode`; the client renders a printable certificate and a public verify link (`/verify-certificate/:code`).

## Reports — Module 22 (role `SCHOOL_ADMIN`, tenant-scoped)

Read-only aggregates over existing data (no new tables).

| Method | Path                  | Description                                                          |
| ------ | --------------------- | ------------------------------------------------------------------- |
| GET    | `/reports/students`   | Headcounts: total/active, by status, by gender, by class            |
| GET    | `/reports/attendance` | Present/absent/late/leave totals + present-rate over `[from, to]` (defaults to last 30 days) |
| GET    | `/reports/finance`    | Invoiced/collected/outstanding, invoices by status, top-10 outstanding balances |

The client renders these as Chart.js charts with CSV export (students-by-class, fee defaulters).

## Settings — Module 24 (role `SCHOOL_ADMIN`, tenant-scoped)

School branding/localization live on the school profile (Module 2). This module adds API keys for integrations; a roles/permissions reference is shown client-side.

| Method | Path                     | Description                                                   |
| ------ | ------------------------ | ------------------------------------------------------------- |
| POST   | `/settings/api-keys`     | Generate a key (`{ name }`); returns the raw `key` **once** (stored only as a hash) |
| GET    | `/settings/api-keys`     | List keys (name, prefix, last-used, created — never the secret) |
| DELETE | `/settings/api-keys/:id` | Revoke (delete) a key                                        |

Keys are `sk_…` tokens; only the SHA-256 hash and an 11-char prefix are persisted.

## AI Assistant — Module 25 (tenant-scoped)

Insights are computed by a deterministic **rules engine** (always available). Report comments and content generation use **Claude** (`claude-opus-4-8`) when `ANTHROPIC_API_KEY` is set on the server, and gracefully fall back to templated output otherwise.

| Method | Path                 | Auth                   | Description                                                            |
| ------ | -------------------- | ---------------------- | --------------------------------------------------------------------- |
| GET    | `/ai/status`         | any authenticated      | `{ aiEnabled }` — whether a live Claude key is configured             |
| GET    | `/ai/insights`       | SCHOOL_ADMIN           | At-risk students flagged by attendance, exam performance, and unpaid fees, with a risk score |
| POST   | `/ai/report-comment` | SCHOOL_ADMIN / TEACHER | `{ studentId }` → a report-card comment grounded in marks + attendance; `{ content, source }` |
| POST   | `/ai/generate`       | SCHOOL_ADMIN / TEACHER | `{ kind: homework\|questions, subject, topic, grade, count }` → generated tasks/questions; `{ content, source }` |

`source` is `"ai"` (Claude) or `"rules"` (fallback). No new tables — insights read existing attendance, marks, and invoice data. The server uses the official `@anthropic-ai/sdk`.

## Behaviour / Discipline — Module N6 (tenant-scoped)

Merits, demerits, and incident notes logged against students. Recording and viewing are `SCHOOL_ADMIN` + `TEACHER`; deletion is `SCHOOL_ADMIN`. `points` is a signed contribution to the student's running score — enforced ≥ 0 for a `MERIT` and ≤ 0 for a `DEMERIT` (`INCIDENT` is 0). The recording staff member is captured from the authenticated user.

| Method | Path                                    | Auth                    | Description                                             |
| ------ | --------------------------------------- | ----------------------- | ------------------------------------------------------ |
| POST   | `/behavior`                             | SCHOOL_ADMIN / TEACHER  | Log a record (`studentId`, `type`, `title`, `points`, `occurredOn?`, `description?`) |
| GET    | `/behavior`                             | SCHOOL_ADMIN / TEACHER  | List records (paginated; `studentId`, `type` filters)  |
| GET    | `/behavior/students/:studentId/summary` | SCHOOL_ADMIN / TEACHER  | A student's tally (merits/demerits/incidents/netPoints) + 10 most recent |
| GET    | `/behavior/:id`                         | SCHOOL_ADMIN / TEACHER  | Get one record                                         |
| PATCH  | `/behavior/:id`                         | SCHOOL_ADMIN / TEACHER  | Update a record (re-checks the points/type sign rule)  |
| DELETE | `/behavior/:id`                         | SCHOOL_ADMIN            | Delete a record                                        |

Types: `MERIT`, `DEMERIT`, `INCIDENT`.

## Medical / Health — Module N5 (role `SCHOOL_ADMIN`, tenant-scoped)

Student medical profiles (one per student) and an infirmary visit log. All routes are `SCHOOL_ADMIN`-only (medical data is sensitive). Mounted at `/medical` (the system health-check owns `/health`). A profile PUT is a full replace — omitted fields are cleared. `bmi` is derived from `heightCm`/`weightKg` (null if either is missing).

| Method | Path                                    | Description                                                  |
| ------ | --------------------------------------- | ------------------------------------------------------------ |
| GET    | `/medical/students/:studentId/profile`  | Get a student's medical profile (or `null`) with derived `bmi` |
| PUT    | `/medical/students/:studentId/profile`  | Upsert the profile (`bloodGroup`, `heightCm`, `weightKg`, `allergies`, `conditions`, `medications`, emergency contact, `notes`) |
| GET    | `/medical/visits`                       | List infirmary visits (paginated; `studentId`, `outcome` filters) |
| POST   | `/medical/visits`                       | Log a visit (`studentId`, `reason`, `treatment?`, `temperatureC?`, `outcome`, `visitedOn?`) |
| GET    | `/medical/visits/:id`                   | Get one visit                                                |
| DELETE | `/medical/visits/:id`                   | Delete a visit                                               |

Visit outcomes: `RESOLVED`, `SENT_HOME`, `REFERRED`, `MONITORING`. Blood groups: `A±`, `B±`, `O±`, `AB±`.

## Notifications — Module N3 (any authenticated user, tenant-scoped)

An in-app inbox: each user sees and manages only their own notifications. Producers in other modules deliver notifications via an internal helper — publishing an announcement fans one out to every active user whose role receives its audience (the author is excluded).

| Method | Path                          | Description                                                     |
| ------ | ----------------------------- | -------------------------------------------------------------- |
| GET    | `/notifications`              | List own notifications (paginated; `unread=true` filter)       |
| GET    | `/notifications/unread-count` | Count of the caller's unread notifications                     |
| POST   | `/notifications/read-all`     | Mark all of the caller's notifications read (`{ updated }`)    |
| POST   | `/notifications/:id/read`     | Mark one notification read                                     |
| DELETE | `/notifications/:id`          | Delete one of the caller's notifications                       |

Types: `GENERAL`, `ANNOUNCEMENT`, `EVENT`, `BEHAVIOR`, `ATTENDANCE`, `FEE`. A notification carries an optional `link` (in-app path) and `body`. Fan-out is best-effort — a delivery failure never fails the triggering action.

## Documents — Module N4 (role `SCHOOL_ADMIN`, tenant-scoped)

A secure document store: files are held by a pluggable storage backend (local filesystem by default via `UPLOAD_DIR`; swap for S3/GCS without touching callers) with metadata in Postgres. A document optionally attaches to one student **or** one employee, else it is school-level. All routes are `SCHOOL_ADMIN`-only. Uploads are `multipart/form-data` (field `file`), capped at `MAX_UPLOAD_MB` (default 10) and restricted to an allow-list of extensions (PDF, images, Office, CSV, TXT). Storage keys are server-generated (`uuid.ext`) so a filename can never traverse the storage root; downloads are streamed with a sanitized `Content-Disposition` filename and `attachment` disposition.

| Method | Path                       | Description                                                              |
| ------ | -------------------------- | ------------------------------------------------------------------------ |
| POST   | `/documents`               | Upload (`file` + `title`, `category`, optional owner: one of `studentId`/`employeeId`/`teacherId`) |
| GET    | `/documents`               | List (paginated; `studentId`, `employeeId`, `teacherId`, `category` filters) |
| GET    | `/documents/:id`           | Get one document's metadata                                              |
| GET    | `/documents/:id/download`  | Download the file (authenticated, tenant-scoped)                         |
| DELETE | `/documents/:id`           | Delete the metadata row and its stored file                             |

Categories: `GENERAL`, `ID_PROOF`, `CERTIFICATE`, `REPORT`, `MEDICAL`, `CONTRACT`, `OTHER`.

## Photos & Branding — Module N4b (role `SCHOOL_ADMIN`, tenant-scoped)

Student profile photos and a school logo, stored via the same file-storage backend as documents. Uploads are `multipart/form-data` (field `file`), image-only (PNG/JPG/WEBP/GIF — **SVG excluded**), with server-generated keys and a MIME derived from the validated extension. Images are served **inline** with `Content-Type` from the stored extension; because auth is bearer-token (not cookie) based, a direct browser navigation without the token returns 401, so images cannot be embedded cross-site with the user's credentials.

| Method | Path                      | Description                                                    |
| ------ | ------------------------- | ------------------------------------------------------------- |
| POST   | `/students/:id/photo`     | Upload/replace a student's photo (`file`)                     |
| GET    | `/students/:id/photo`     | Fetch the student's photo (inline image; 404 if none)         |
| DELETE | `/students/:id/photo`     | Remove the student's photo                                    |
| POST   | `/teachers/:id/photo`     | Upload/replace a teacher's photo (`file`)                     |
| GET    | `/teachers/:id/photo`     | Fetch the teacher's photo (inline image; 404 if none)         |
| DELETE | `/teachers/:id/photo`     | Remove the teacher's photo                                    |
| POST   | `/settings/logo`          | Upload/replace the caller's school logo (`file`)              |
| GET    | `/settings/logo`          | Fetch the school logo (inline image; 404 if none)             |
| DELETE | `/settings/logo`          | Remove the school logo                                        |

`Student.photoKey` and `School.logoKey` hold the storage keys (null when unset); `School.logoKey` takes precedence over the external `logoUrl`.
