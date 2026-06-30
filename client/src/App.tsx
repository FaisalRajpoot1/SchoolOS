import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';

export function App() {
  // Attempt to restore the session before rendering routes.
  useAuthBootstrap();
  return <RouterProvider router={router} />;
}
