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
import { StudentDetailPage } from '@/features/students/pages/StudentDetailPage';
import { TeachersListPage } from '@/features/teachers/pages/TeachersListPage';
import { AddTeacherPage } from '@/features/teachers/pages/AddTeacherPage';
import { TeacherDetailPage } from '@/features/teachers/pages/TeacherDetailPage';

/** Application route tree. Feature routes are nested under the app shell. */
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },

  // Authenticated app shell.
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
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
              { path: '/settings/school', element: <SchoolSettingsPage /> },
              { path: '/academics/classes', element: <ClassesPage /> },
              { path: '/academics/classes/:classId', element: <ClassDetailPage /> },
              { path: '/academics/subjects', element: <SubjectsPage /> },
              { path: '/students', element: <StudentsListPage /> },
              { path: '/students/new', element: <AdmitStudentPage /> },
              { path: '/students/:id', element: <StudentDetailPage /> },
              { path: '/teachers', element: <TeachersListPage /> },
              { path: '/teachers/new', element: <AddTeacherPage /> },
              { path: '/teachers/:id', element: <TeacherDetailPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
