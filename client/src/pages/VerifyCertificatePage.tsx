import { Link, useParams } from 'react-router-dom';
import { useVerifyCertificate } from '@/features/certificates/useCertificates';

export function VerifyCertificatePage() {
  const { code = '' } = useParams();
  const result = useVerifyCertificate(code);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <Link to="/" className="text-xl font-bold">
            School<span className="text-brand-600">OS</span>
          </Link>
          <p className="text-sm text-slate-500">Certificate verification</p>
        </div>

        {result.isLoading ? (
          <p className="text-center text-sm text-slate-500">Checking…</p>
        ) : result.data?.valid && result.data.certificate ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-medium text-green-700">
              ✓ Valid certificate
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Serial</dt><dd className="font-mono">{result.data.certificate.serialNo}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd>{result.data.certificate.type}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Student</dt><dd>{result.data.certificate.studentName}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">School</dt><dd>{result.data.certificate.schoolName}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Issued</dt><dd>{result.data.certificate.issueDate.slice(0, 10)}</dd></div>
            </dl>
          </div>
        ) : (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
            ✗ No certificate matches this code
          </div>
        )}
      </div>
    </main>
  );
}
