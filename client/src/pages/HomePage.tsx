import { motion } from 'framer-motion';

/** Public landing placeholder — replaced by the marketing/auth flow. */
export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
          Multi-tenant School ERP
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          School<span className="text-brand-600">OS</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-600">
          A complete operating system for schools — admissions, academics, attendance, fees, exams,
          and more. No more spreadsheets.
        </p>
      </motion.div>
    </main>
  );
}
