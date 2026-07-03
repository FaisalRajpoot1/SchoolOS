import { Router } from 'express';
import { auditMutations } from '@/middlewares/audit.middleware';
import { healthRoutes } from '@/features/health/health.routes';
import { authRoutes } from '@/features/auth/auth.routes';
import { schoolRoutes } from '@/features/schools/schools.routes';
import { academicYearRoutes } from '@/features/academicYears/academicYears.routes';
import { classRoutes } from '@/features/classes/classes.routes';
import { subjectRoutes } from '@/features/subjects/subjects.routes';
import { studentRoutes } from '@/features/students/students.routes';
import { teacherRoutes } from '@/features/teachers/teachers.routes';
import { attendanceRoutes } from '@/features/attendance/attendance.routes';
import { feeCategoryRoutes } from '@/features/feeCategories/feeCategories.routes';
import { invoiceRoutes } from '@/features/invoices/invoices.routes';
import { dashboardRoutes } from '@/features/dashboard/dashboard.routes';
import { examRoutes } from '@/features/exams/exams.routes';
import { homeworkRoutes } from '@/features/homework/homework.routes';
import { auditRoutes } from '@/features/audit/audit.routes';
import { parentRoutes } from '@/features/parents/parents.routes';
import { portalRoutes } from '@/features/portal/portal.routes';
import { studentPortalRoutes } from '@/features/studentPortal/studentPortal.routes';
import { assignmentRoutes } from '@/features/assignments/assignments.routes';
import { timetableRoutes } from '@/features/timetable/timetable.routes';
import { libraryRoutes } from '@/features/library/library.routes';
import { transportRoutes } from '@/features/transport/transport.routes';
import { announcementRoutes } from '@/features/announcements/announcements.routes';
import { hostelRoutes } from '@/features/hostel/hostel.routes';
import { inventoryRoutes } from '@/features/inventory/inventory.routes';
import { hrRoutes } from '@/features/hr/hr.routes';
import { payrollRoutes } from '@/features/payroll/payroll.routes';
import { eventRoutes } from '@/features/events/events.routes';
import { certificateRoutes } from '@/features/certificates/certificates.routes';
import { reportRoutes } from '@/features/reports/reports.routes';
import { settingsRoutes } from '@/features/settings/settings.routes';
import { aiRoutes } from '@/features/ai/ai.routes';
import { admissionRoutes } from '@/features/admissions/admissions.routes';
import { behaviorRoutes } from '@/features/behavior/behavior.routes';
import { medicalRoutes } from '@/features/medical/medical.routes';
import { notificationRoutes } from '@/features/notifications/notifications.routes';

/**
 * Aggregates all feature routers under the API prefix.
 * New feature modules register their router here.
 */
const router = Router();

// Audit every authenticated mutation (best-effort; see the middleware).
router.use(auditMutations);

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/classes', classRoutes);
router.use('/subjects', subjectRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/fee-categories', feeCategoryRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/exams', examRoutes);
router.use('/homework', homeworkRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/parents', parentRoutes);
router.use('/portal', portalRoutes);
router.use('/student-portal', studentPortalRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/timetable', timetableRoutes);
router.use('/library', libraryRoutes);
router.use('/transport', transportRoutes);
router.use('/announcements', announcementRoutes);
router.use('/hostels', hostelRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/hr', hrRoutes);
router.use('/payroll', payrollRoutes);
router.use('/events', eventRoutes);
router.use('/certificates', certificateRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/ai', aiRoutes);
router.use('/admissions', admissionRoutes);
router.use('/behavior', behaviorRoutes);
router.use('/medical', medicalRoutes);
router.use('/notifications', notificationRoutes);
// ...future feature routers

export const apiRouter = router;
