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

Employment types: `FULL_TIME`, `PART_TIME`, `CONTRACT`. Leave types: `CASUAL`, `SICK`, `ANNUAL`, `UNPAID`. (Payroll/salary generation is Module 18.)
