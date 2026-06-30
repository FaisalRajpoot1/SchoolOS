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
            children: [{ path: '/settings/school', element: <SchoolSettingsPage /> }],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);
