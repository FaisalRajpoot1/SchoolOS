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

Auth events are recorded automatically: `auth.register`, `auth.login`, `auth.logout`, `auth.password_reset_requested`, `auth.password_reset`, `auth.password_changed`, `auth.session_revoked`, `auth.sessions_revoked_others`.

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
| PATCH  | `/invoices/:id`                     | Update title/dueDate/notes                                   |
| POST   | `/invoices/:id/cancel`              | Cancel an invoice                                            |
| DELETE | `/invoices/:id`                     | Delete an invoice                                            |
| POST   | `/invoices/:id/payments`            | Record a payment (recomputes status PENDING/PARTIAL/PAID)    |
| DELETE | `/invoices/:id/payments/:paymentId` | Remove a payment (recomputes status)                        |

Invoice statuses: `PENDING`, `PARTIAL`, `PAID`, `CANCELLED`. Payment methods: `CASH`, `CARD`, `BANK_TRANSFER`, `ONLINE`, `OTHER`.

## Dashboard — Module 23 (role `SCHOOL_ADMIN`, tenant-scoped)

| Method | Path         | Description                                                            |
| ------ | ------------ | --------------------------------------------------------------------- |
| GET    | `/dashboard` | Aggregated KPIs: student/teacher/class/section counts, today's attendance breakdown + rate, finance (invoiced/collected/outstanding + invoices by status), and recent invoices |

## Examination — Module 12 (tenant-scoped)

Exam management is `SCHOOL_ADMIN`; marks entry and results are `SCHOOL_ADMIN` + `TEACHER`.

| Method | Path                                       | Description                                                       |
| ------ | ------------------------------------------ | ----------------------------------------------------------------- |
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

Grade scale: A+ ≥90, A ≥80, B ≥70, C ≥60, D ≥50, E ≥40, else F.

## Homework — Module 10 (roles `SCHOOL_ADMIN` + `TEACHER`, tenant-scoped)

| Method | Path                                       | Description                                                     |
| ------ | ------------------------------------------ | --------------------------------------------------------------- |
| POST   | `/homework`                                | Create homework for a section (author teacher resolved from the caller) |
| GET    | `/homework`                                | List homework (`page`, `limit`, `search`, `classId`, `sectionId`, `subjectId`) |
| GET    | `/homework/:id`                            | Homework detail + submission count                              |
| PATCH  | `/homework/:id`                            | Update title/description/dueDate/attachment/subject            |
| DELETE | `/homework/:id`                            | Delete homework                                                 |
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
| POST   | `/timetable/slots`      | Add a slot (rejects section/teacher/room clashes on the same day)   |
| PATCH  | `/timetable/slots/:id`  | Update a slot (re-checks clashes)                                    |
| DELETE | `/timetable/slots/:id`  | Delete a slot                                                       |

Conflict detection: two slots overlap when `existing.start < new.end AND existing.end > new.start` on the same day — enforced for the section, the assigned teacher (across all sections), and the room.
