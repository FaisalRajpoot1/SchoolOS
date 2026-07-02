import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/components/common/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SchoolsListPage } from '@/features/schools/pages/SchoolsListPage';
import { CreateSchoolPage } from '@/features/schools/pages/CreateSchoolPage';
import { SchoolSettingsPage } from '@/features/schools/pages/SchoolSettingsPage';
import { ClassesPage } from '@/features/academics/pages/ClassesPage';
import { ClassDetailPage } from '@/features/academics/pages/ClassDetailPage';
import { SubjectsPage } from '@/features/academics/pages/SubjectsPage';
import { StudentsListPage } from '@/features/students/pages/StudentsListPage';
import { AdmitStudentPage } from '@/features/students/pages/AdmitStudentPage';
import { BulkImportPage } from '@/features/students/pages/BulkImportPage';
import { StudentDetailPage } from '@/features/students/pages/StudentDetailPage';
import { TeachersListPage } from '@/features/teachers/pages/TeachersListPage';
import { AddTeacherPage } from '@/features/teachers/pages/AddTeacherPage';
import { TeacherDetailPage } from '@/features/teachers/pages/TeacherDetailPage';
import { AttendancePage } from '@/features/attendance/pages/AttendancePage';
import { AttendanceSummaryPage } from '@/features/attendance/pages/AttendanceSummaryPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { SettingsHubPage } from '@/features/settings/pages/SettingsHubPage';
import { AiInsightsPage } from '@/features/ai/pages/AiInsightsPage';
import { ApiKeysPage } from '@/features/settings/pages/ApiKeysPage';
import { FeeCategoriesPage } from '@/features/fees/pages/FeeCategoriesPage';
import { InvoicesListPage } from '@/features/fees/pages/InvoicesListPage';
import { CreateInvoicePage } from '@/features/fees/pages/CreateInvoicePage';
import { InvoiceDetailPage } from '@/features/fees/pages/InvoiceDetailPage';
import { ExamsListPage } from '@/features/exams/pages/ExamsListPage';
import { CreateExamPage } from '@/features/exams/pages/CreateExamPage';
import { ExamDetailPage } from '@/features/exams/pages/ExamDetailPage';
import { MarksEntryPage } from '@/features/exams/pages/MarksEntryPage';
import { ExamResultsPage } from '@/features/exams/pages/ExamResultsPage';
import { HomeworkListPage } from '@/features/homework/pages/HomeworkListPage';
import { CreateHomeworkPage } from '@/features/homework/pages/CreateHomeworkPage';
import { HomeworkDetailPage } from '@/features/homework/pages/HomeworkDetailPage';
import { TimetablePage } from '@/features/timetable/pages/TimetablePage';
import { BooksListPage } from '@/features/library/pages/BooksListPage';
import { BookDetailPage } from '@/features/library/pages/BookDetailPage';
import { BookCategoriesPage } from '@/features/library/pages/BookCategoriesPage';
import { IssuesListPage } from '@/features/library/pages/IssuesListPage';
import { AnnouncementsFeedPage } from '@/features/announcements/pages/AnnouncementsFeedPage';
import { ManageAnnouncementsPage } from '@/features/announcements/pages/ManageAnnouncementsPage';
import { VehiclesPage } from '@/features/transport/pages/VehiclesPage';
import { RoutesListPage } from '@/features/transport/pages/RoutesListPage';
import { RouteDetailPage } from '@/features/transport/pages/RouteDetailPage';
import { HostelsListPage } from '@/features/hostel/pages/HostelsListPage';
import { HostelDetailPage } from '@/features/hostel/pages/HostelDetailPage';
import { ItemsListPage } from '@/features/inventory/pages/ItemsListPage';
import { ItemDetailPage } from '@/features/inventory/pages/ItemDetailPage';
import { SuppliersPage } from '@/features/inventory/pages/SuppliersPage';
import { EmployeesListPage } from '@/features/hr/pages/EmployeesListPage';
import { AddEmployeePage } from '@/features/hr/pages/AddEmployeePage';
import { EmployeeDetailPage } from '@/features/hr/pages/EmployeeDetailPage';
import { LeaveRequestsPage } from '@/features/hr/pages/LeaveRequestsPage';
import { PayslipsListPage } from '@/features/payroll/pages/PayslipsListPage';
import { PayslipDetailPage } from '@/features/payroll/pages/PayslipDetailPage';
import { EventsCalendarPage } from '@/features/events/pages/EventsCalendarPage';
import { ManageEventsPage } from '@/features/events/pages/ManageEventsPage';
import { AssignmentsListPage } from '@/features/assignments/pages/AssignmentsListPage';
import { CreateAssignmentPage } from '@/features/assignments/pages/CreateAssignmentPage';
import { AssignmentDetailPage } from '@/features/assignments/pages/AssignmentDetailPage';
import { CertificatesListPage } from '@/features/certificates/pages/CertificatesListPage';
import { CertificateDetailPage } from '@/features/certificates/pages/CertificateDetailPage';
import { VerifyCertificatePage } from '@/pages/VerifyCertificatePage';
import { ApplyPage } from '@/features/admissions/pages/ApplyPage';
import { AdmissionsPage } from '@/features/admissions/pages/AdmissionsPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { SecurityPage } from '@/features/auth/pages/SecurityPage';
import { AuditLogsPage } from '@/features/audit/pages/AuditLogsPage';
import { ParentsListPage } from '@/features/parents/pages/ParentsListPage';
import { AddParentPage } from '@/features/parents/pages/AddParentPage';
import { ParentDetailPage } from '@/features/parents/pages/ParentDetailPage';
import { ChildPage } from '@/features/portal/pages/ChildPage';
import { StudentPortalPage } from '@/features/studentPortal/pages/StudentPortalPage';

/** Application route tree. Feature routes are nested under the app shell. */
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verify-certificate/:code', element: <VerifyCertificatePage /> },
  { path: '/apply/:schoolId', element: <ApplyPage /> },

  // Authenticated app shell.
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          // Available to every authenticated user.
          { path: '/settings/security', element: <SecurityPage /> },
          { path: '/announcements', element: <AnnouncementsFeedPage /> },
          { path: '/events', element: <EventsCalendarPage /> },
          {
            element: <ProtectedRoute roles={['SCHOOL_ADMIN']} />,
            children: [
              { path: '/announcements/manage', element: <ManageAnnouncementsPage /> },
              { path: '/events/manage', element: <ManageEventsPage /> },
            ],
          },
          // PARENT portal.
          {
            element: <ProtectedRoute roles={['PARENT']} />,
            children: [{ path: '/portal/children/:studentId', element: <ChildPage /> }],
          },
          // STUDENT portal.
          {
            element: <ProtectedRoute roles={['STUDENT']} />,
            children: [{ path: '/student', element: <StudentPortalPage /> }],
          },
          // School and platform admins.
          {
            element: <ProtectedRoute roles={['SCHOOL_ADMIN', 'SUPER_ADMIN']} />,
            children: [{ path: '/audit-logs', element: <AuditLogsPage /> }],
          },
          // Certificates — school admins and receptionists.
          {
            element: <ProtectedRoute roles={['SCHOOL_ADMIN', 'RECEPTIONIST']} />,
            children: [
              { path: '/certificates', element: <CertificatesListPage /> },
              { path: '/certificates/:id', element: <CertificateDetailPage /> },
            ],
          },
          // HR — school admins and HR staff.
          {
            element: <ProtectedRoute roles={['SCHOOL_ADMIN', 'HR']} />,
            children: [
              { path: '/hr/employees', element: <EmployeesListPage /> },
              { path: '/hr/employees/new', element: <AddEmployeePage /> },
              { path: '/hr/employees/:id', element: <EmployeeDetailPage /> },
              { path: '/hr/leave', element: <LeaveRequestsPage /> },
              { path: '/payroll/payslips', element: <PayslipsListPage /> },
              { path: '/payroll/payslips/:id', element: <PayslipDetailPage /> },
            ],
          },
          // Library — school admins and librarians.
          {
            element: <ProtectedRoute roles={['SCHOOL_ADMIN', 'LIBRARIAN']} />,
            children: [
              { path: '/library', element: <BooksListPage /> },
              { path: '/library/books/:id', element: <BookDetailPage /> },
              { path: '/library/categories', element: <BookCategoriesPage /> },
              { path: '/library/issues', element: <IssuesListPage /> },
            ],
          },
          // SUPER_ADMIN only.
          {
            element: <ProtectedRoute roles={['SUPER_ADMIN']} />,
            children: [
              { path: '/schools', element: <SchoolsListPage /> },
              { path: '/schools/new', element: <CreateSchoolPage /> },
            ],
          },
          // SCHOOL_ADMIN only.
          {
            element: <ProtectedRoute roles={['SCHOOL_ADMIN']} />,
            children: [
              { path: '/settings', element: <SettingsHubPage /> },
              { path: '/settings/school', element: <SchoolSettingsPage /> },
              { path: '/settings/api-keys', element: <ApiKeysPage /> },
              { path: '/reports', element: <ReportsPage /> },
              { path: '/ai', element: <AiInsightsPage /> },
              { path: '/academics/classes', element: <ClassesPage /> },
              { path: '/academics/classes/:classId', element: <ClassDetailPage /> },
              { path: '/academics/subjects', element: <SubjectsPage /> },
              { path: '/timetable', element: <TimetablePage /> },
              { path: '/students', element: <StudentsListPage /> },
              { path: '/students/new', element: <AdmitStudentPage /> },
              { path: '/students/import', element: <BulkImportPage /> },
              { path: '/admissions', element: <AdmissionsPage /> },
              { path: '/students/:id', element: <StudentDetailPage /> },
              { path: '/teachers', element: <TeachersListPage /> },
              { path: '/teachers/new', element: <AddTeacherPage /> },
              { path: '/teachers/:id', element: <TeacherDetailPage /> },
              { path: '/attendance', element: <AttendancePage /> },
              { path: '/attendance/summary', element: <AttendanceSummaryPage /> },
              { path: '/fees/invoices', element: <InvoicesListPage /> },
              { path: '/fees/invoices/new', element: <CreateInvoicePage /> },
              { path: '/fees/invoices/:id', element: <InvoiceDetailPage /> },
              { path: '/fees/categories', element: <FeeCategoriesPage /> },
              { path: '/exams', element: <ExamsListPage /> },
              { path: '/exams/new', element: <CreateExamPage /> },
              { path: '/exams/:id', element: <ExamDetailPage /> },
              { path: '/exams/:id/results', element: <ExamResultsPage /> },
              { path: '/exams/:id/subjects/:examSubjectId/marks', element: <MarksEntryPage /> },
              { path: '/homework', element: <HomeworkListPage /> },
              { path: '/homework/new', element: <CreateHomeworkPage /> },
              { path: '/homework/:id', element: <HomeworkDetailPage /> },
              { path: '/assignments', element: <AssignmentsListPage /> },
              { path: '/assignments/new', element: <CreateAssignmentPage /> },
              { path: '/assignments/:id', element: <AssignmentDetailPage /> },
              { path: '/parents', element: <ParentsListPage /> },
              { path: '/parents/new', element: <AddParentPage /> },
              { path: '/parents/:id', element: <ParentDetailPage /> },
              { path: '/transport/vehicles', element: <VehiclesPage /> },
              { path: '/transport/routes', element: <RoutesListPage /> },
              { path: '/transport/routes/:id', element: <RouteDetailPage /> },
              { path: '/hostels', element: <HostelsListPage /> },
              { path: '/hostels/:id', element: <HostelDetailPage /> },
              { path: '/inventory/items', element: <ItemsListPage /> },
              { path: '/inventory/items/:id', element: <ItemDetailPage /> },
              { path: '/inventory/suppliers', element: <SuppliersPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
