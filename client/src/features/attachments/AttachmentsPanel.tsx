import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attachmentsApi, type Attachment } from './attachments.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Attachments list + upload/download/remove for a task at `basePath`. */
export function AttachmentsPanel({ basePath }: { basePath: string }) {
  const qc = useQueryClient();
  const key = ['attachments', basePath] as const;
  const list = useQuery({ queryKey: key, queryFn: () => attachmentsApi.list(basePath) });
  const fileInput = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState('');

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(basePath, file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success('Attachment uploaded');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => attachmentsApi.remove(basePath, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: key });
      toast.success('Attachment removed');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onPick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (fileInput.current) fileInput.current.value = '';
    if (file) upload.mutate(file);
  };

  const doDownload = (att: Attachment): void => {
    setDownloadingId(att.id);
    attachmentsApi
      .download(basePath, att)
      .catch((err: unknown) => toast.error(getApiErrorMessage(err, 'Could not download the file')))
      .finally(() => setDownloadingId(''));
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Attachments</h2>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={onPick}
          className="hidden"
        />
        <Button
          variant="secondary"
          className="py-1"
          onClick={() => fileInput.current?.click()}
          isLoading={upload.isPending}
        >
          Upload
        </Button>
      </div>

      {list.isLoading ? (
        <Spinner />
      ) : list.data && list.data.length === 0 ? (
        <p className="text-sm text-slate-400">No attachments yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.data?.map((att) => (
            <li key={att.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{att.originalName}</p>
                <p className="text-xs text-slate-400">{formatBytes(att.sizeBytes)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  className="py-1"
                  onClick={() => doDownload(att)}
                  isLoading={downloadingId === att.id}
                >
                  Download
                </Button>
                <button
                  onClick={() => remove.mutate(att.id)}
                  disabled={remove.isPending && remove.variables === att.id}
                  className="text-xs text-red-600 disabled:opacity-50"
                >
                  remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
