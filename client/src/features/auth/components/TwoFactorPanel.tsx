import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type TwoFactorSetup } from '../auth.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const KEY = ['auth', '2fa', 'status'] as const;

function BackupCodes({ codes }: { codes: string[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-sm font-medium text-amber-800">
        Save these backup codes now — each works once and they won't be shown again.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm text-slate-700">
        {codes.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(codes.join('\n'));
          toast.success('Backup codes copied');
        }}
        className="mt-2 text-xs font-medium text-amber-800 hover:underline"
      >
        Copy all
      </button>
    </div>
  );
}

export function TwoFactorPanel() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: KEY, queryFn: () => authApi.twoFactorStatus() });

  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const refresh = (): void => void qc.invalidateQueries({ queryKey: KEY });

  const beginSetup = useMutation({
    mutationFn: () => authApi.twoFactorSetup(),
    onSuccess: (data) => { setSetup(data); setNewCodes(null); },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const enable = useMutation({
    mutationFn: () => authApi.twoFactorEnable(code.trim()),
    onSuccess: (data) => {
      setNewCodes(data.backupCodes);
      setSetup(null);
      setCode('');
      refresh();
      toast.success('Two-factor auth enabled');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const disable = useMutation({
    mutationFn: (password: string) => authApi.twoFactorDisable(password),
    onSuccess: () => { setNewCodes(null); refresh(); toast.success('Two-factor auth disabled'); },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const regenerate = useMutation({
    mutationFn: (c: string) => authApi.twoFactorRegenerate(c),
    onSuccess: (data) => { setNewCodes(data.backupCodes); refresh(); toast.success('New backup codes generated'); },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const onDisable = (): void => {
    const password = window.prompt('Enter your password to disable two-factor auth:');
    if (password) disable.mutate(password);
  };
  const onRegenerate = (): void => {
    const c = window.prompt('Enter a current 6-digit code to regenerate backup codes:');
    if (c) regenerate.mutate(c.trim());
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Two-factor authentication</h2>
        {status.data && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              status.data.enabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {status.data.enabled ? 'On' : 'Off'}
          </span>
        )}
      </div>

      {status.isLoading ? (
        <Spinner />
      ) : status.data?.enabled ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Your account is protected by an authenticator app.{' '}
            {status.data.backupCodesRemaining} backup code
            {status.data.backupCodesRemaining === 1 ? '' : 's'} remaining.
          </p>
          {newCodes && <BackupCodes codes={newCodes} />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onRegenerate} isLoading={regenerate.isPending}>
              Regenerate backup codes
            </Button>
            <Button variant="danger" onClick={onDisable} isLoading={disable.isPending}>
              Disable
            </Button>
          </div>
        </div>
      ) : setup ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          <img src={setup.qrDataUrl} alt="2FA QR code" className="h-40 w-40" />
          <p className="text-xs text-slate-500">
            Or enter this key manually: <span className="font-mono">{setup.secret}</span>
          </p>
          <div className="w-40">
            <TextField
              label="6-digit code"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => enable.mutate()} isLoading={enable.isPending} disabled={code.trim().length !== 6}>
              Enable
            </Button>
            <Button variant="secondary" onClick={() => { setSetup(null); setCode(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Add a second step to your login using an authenticator app (TOTP).
          </p>
          {newCodes && <BackupCodes codes={newCodes} />}
          <Button onClick={() => beginSetup.mutate()} isLoading={beginSetup.isPending}>
            Set up two-factor auth
          </Button>
        </div>
      )}
    </Card>
  );
}
