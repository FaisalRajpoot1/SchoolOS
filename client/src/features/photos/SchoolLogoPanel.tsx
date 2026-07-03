import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { photosApi } from './photos.api';
import { useObjectUrl } from '@/lib/useObjectUrl';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

/** Logo preview + upload/replace/remove for the admin's own school. */
export function SchoolLogoPanel({ initialHasLogo }: { initialHasLogo: boolean }) {
  const [hasLogo, setHasLogo] = useState(initialHasLogo);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const url = useObjectUrl(photosApi.logoUrl(), hasLogo, version);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    setBusy(true);
    photosApi
      .uploadLogo(file)
      .then(() => {
        setHasLogo(true);
        setVersion((v) => v + 1);
        toast.success('Logo updated');
      })
      .catch((err: unknown) => toast.error(getApiErrorMessage(err)))
      .finally(() => setBusy(false));
  };

  const onRemove = (): void => {
    setBusy(true);
    photosApi
      .deleteLogo()
      .then(() => {
        setHasLogo(false);
        setVersion((v) => v + 1);
        toast.success('Logo removed');
      })
      .catch((err: unknown) => toast.error(getApiErrorMessage(err)))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {url ? (
          <img src={url} alt="School logo" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">No logo</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onPick}
          className="hidden"
        />
        <Button
          variant="secondary"
          className="py-1"
          onClick={() => fileInput.current?.click()}
          isLoading={busy}
        >
          {hasLogo ? 'Replace logo' : 'Upload logo'}
        </Button>
        {hasLogo && (
          <button onClick={onRemove} disabled={busy} className="text-xs text-red-600 disabled:opacity-50">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
