import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-brand-600">404</h1>
      <p className="text-slate-600">This page could not be found.</p>
      <Link to="/" className="font-medium text-brand-600 underline">
        Back home
      </Link>
    </main>
  );
}
