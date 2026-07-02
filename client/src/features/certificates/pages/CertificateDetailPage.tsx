import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCertificate, useDeleteCertificate } from '../useCertificates';
import { certificatesApi } from '../certificates.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function CertificateDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const certificate = useCertificate(id);
  const remove = useDeleteCertificate();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (certificate.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (certificate.isError || !certificate.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(certificate.error)}</p>;

  const c = certificate.data;
  const verifyUrl = `${window.location.origin}/verify-certificate/${c.verificationCode}`;

  const handleDelete = async (): Promise<void> => {
    await remove.mutateAsync(id);
    navigate('/certificates', { replace: true });
  };

  const handleDownload = async (): Promise<void> => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await certificatesApi.downloadPdf(c.id, c.serialNo);
    } catch (err) {
      setDownloadError(getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/certificates" className="text-sm text-brand-600">← Back to certificates</Link>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleDownload} isLoading={downloading}>Download PDF</Button>
          <Button variant="secondary" onClick={() => window.print()}>Print</Button>
          <Button variant="danger" onClick={handleDelete} isLoading={remove.isPending}>Delete</Button>
        </div>
      </div>

      {downloadError && <p className="text-sm text-red-600 print:hidden">{downloadError}</p>}

      {/* Printable certificate */}
      <Card className="space-y-6 border-2 border-slate-300 p-10 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{c.title}</h1>
        <p className="font-mono text-xs text-slate-400">Serial No. {c.serialNo}</p>
        <p className="text-left text-base leading-relaxed text-slate-700">{c.body}</p>
        <div className="flex items-end justify-between pt-8 text-left text-sm">
          <div>
            <p className="text-xs text-slate-400">Issued on</p>
            <p>{c.issueDate.slice(0, 10)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Verification code</p>
            <p className="font-mono">{c.verificationCode}</p>
          </div>
        </div>
      </Card>

      <Card className="print:hidden">
        <p className="text-sm text-slate-500">Verify this certificate at:</p>
        <Link to={`/verify-certificate/${c.verificationCode}`} className="break-all text-sm text-brand-600 underline">
          {verifyUrl}
        </Link>
      </Card>
    </div>
  );
}
