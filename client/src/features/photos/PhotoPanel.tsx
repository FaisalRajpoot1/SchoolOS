import { useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

/** Avatar + upload/replace/remove controls for a person's profile photo. */
export function PhotoPanel({
  src,
  name,
  initialHasPhoto,
  upload,
  remove,
}: {
  src: string;
  name: string;
  initialHasPhoto: boolean;
  upload: (file: File) => Promise<void>;
  remove: () => Promise<void>;
}) {
  const [hasPhoto, setHasPhoto] = useState(initialHasPhoto);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    setBusy(true);
    upload(file)
      .then(() => {
        setHasPhoto(true);
        setVersion((v) => v + 1);
        toast.success('Photo updated');
      })
      .catch((err: unknown) => toast.error(getApiErrorMessage(err)))
      .finally(() => setBusy(false));
  };

  const onRemove = (): void => {
    setBusy(true);
    remove()
      .then(() => {
        setHasPhoto(false);
        setVersion((v) => v + 1);
        toast.success('Photo removed');
      })
      .catch((err: unknown) => toast.error(getApiErrorMessage(err)))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar src={src} name={name} hasImage={hasPhoto} size={72} version={version} />
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
          {hasPhoto ? 'Replace photo' : 'Upload photo'}
        </Button>
        {hasPhoto && (
          <button
            onClick={onRemove}
            disabled={busy}
            className="text-xs text-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
