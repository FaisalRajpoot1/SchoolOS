import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from '../useApiKeys';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const schema = z.object({ name: z.string().min(1, 'Name is required') });
type FormValues = z.infer<typeof schema>;

export function ApiKeysPage() {
  const keys = useApiKeys();
  const create = useCreateApiKey();
  const remove = useDeleteApiKey();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await create.mutateAsync(values.name);
    setNewKey(result.key);
    setCopied(false);
    reset();
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link to="/settings" className="text-sm text-brand-600">← Back to settings</Link>
        <h1 className="mt-2 text-2xl font-bold">API keys</h1>
        <p className="text-slate-500">For third-party integrations. Keys are shown only once.</p>
      </div>

      {newKey && (
        <Card className="space-y-2 border-brand-200 bg-brand-50">
          <p className="text-sm font-medium text-brand-800">New key — copy it now, it won't be shown again:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm">{newKey}</code>
            <Button
              variant="secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(newKey);
                setCopied(true);
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <button onClick={() => setNewKey(null)} className="text-xs text-slate-500 underline">Dismiss</button>
        </Card>
      )}

      <Card>
        <form onSubmit={onSubmit} noValidate className="flex items-start gap-3">
          <div className="flex-1">
            <TextField label="Key name" placeholder="e.g. Reporting integration" {...register('name')} error={errors.name?.message} />
          </div>
          <div className="pt-6"><Button type="submit" isLoading={create.isPending}>Generate</Button></div>
        </form>
        {create.isError && <p className="mt-2 text-sm text-red-600">{getApiErrorMessage(create.error)}</p>}
      </Card>

      <Card className="p-0">
        {keys.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : keys.data && keys.data.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {keys.data.map((k) => (
              <li key={k.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="font-mono text-xs text-slate-500">{k.prefix}… · created {k.createdAt.slice(0, 10)}</p>
                </div>
                <Button variant="danger" isLoading={remove.isPending && remove.variables === k.id} onClick={() => remove.mutate(k.id)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm text-slate-500">No API keys yet.</p>
        )}
      </Card>
    </div>
  );
}
