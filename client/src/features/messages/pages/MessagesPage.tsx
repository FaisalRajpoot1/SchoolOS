import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useContacts, useCreateThread, usePostMessage, useThread, useThreads } from '../useMessages';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

function Conversation({ threadId }: { threadId: string }) {
  const { data, isLoading, isError, error } = useThread(threadId);
  const post = usePostMessage(threadId);
  const [body, setBody] = useState('');

  const send = (): void => {
    const text = body.trim();
    if (!text) return;
    post.mutate(text, {
      onSuccess: () => setBody(''),
      onError: (err) => toast.error(getApiErrorMessage(err, 'Could not send the message')),
    });
  };

  if (isLoading) return <Spinner />;
  if (isError || !data) return <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 pb-3">
        <p className="font-semibold">{data.thread.subject}</p>
        <p className="text-xs text-slate-500">
          {data.thread.withName}
          {data.thread.student ? ` · about ${data.thread.student.name}` : ''}
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto py-3">
        {data.messages.length === 0 ? (
          <p className="text-sm text-slate-400">No messages yet.</p>
        ) : (
          data.messages.map((m) => (
            <div key={m.id} className={m.mine ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.mine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.mine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex items-end gap-2 border-t border-slate-200 pt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Write a reply…"
          className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <Button onClick={send} isLoading={post.isPending} disabled={!body.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

function NewThread({ onCreated }: { onCreated: (id: string) => void }) {
  const contacts = useContacts(true);
  const create = useCreateThread();
  const [toUserId, setToUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!toUserId || !subject.trim() || !body.trim()) {
      toast.error('Pick a recipient and fill in the subject and message');
      return;
    }
    create.mutate(
      { toUserId, subject: subject.trim(), body: body.trim() },
      {
        onSuccess: (thread) => {
          toast.success('Message sent');
          onCreated(thread.id);
        },
        onError: (err) => toast.error(getApiErrorMessage(err, 'Could not start the conversation')),
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-semibold">New message</h2>
      {contacts.isLoading ? (
        <Spinner />
      ) : contacts.data && contacts.data.length === 0 ? (
        <p className="text-sm text-slate-500">
          No contacts available yet. Contacts appear once you share a class or child.
        </p>
      ) : (
        <>
          <Select label="To" value={toUserId} onChange={(e) => setToUserId(e.target.value)}>
            <option value="">Select a recipient</option>
            {contacts.data?.map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.name}
                {c.students && c.students.length > 0 ? ` (${c.students.join(', ')})` : ''}
              </option>
            ))}
          </Select>
          <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <Button type="submit" isLoading={create.isPending}>
            Send
          </Button>
        </>
      )}
    </form>
  );
}

export function MessagesPage() {
  const { id: routeId } = useParams();
  const threads = useThreads();
  const [selectedId, setSelectedId] = useState(routeId ?? '');
  const [composing, setComposing] = useState(false);

  // Resync when following a second deep-link while already mounted.
  useEffect(() => {
    if (routeId) {
      setSelectedId(routeId);
      setComposing(false);
    }
  }, [routeId]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-slate-500">Conversations between parents and teachers.</p>
        </div>
        <Button onClick={() => { setComposing(true); setSelectedId(''); }}>New message</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
        <Card className="p-0">
          {threads.isLoading ? (
            <div className="p-6"><Spinner /></div>
          ) : threads.isError ? (
            <p className="p-6 text-sm text-red-600">{getApiErrorMessage(threads.error)}</p>
          ) : threads.data && threads.data.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {threads.data?.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => { setSelectedId(t.id); setComposing(false); }}
                    className={`flex w-full items-start justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50 ${
                      selectedId === t.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.subject}</p>
                      <p className="truncate text-xs text-slate-500">
                        {t.withName}
                        {t.student ? ` · ${t.student.name}` : ''}
                      </p>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                        {t.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-h-[24rem]">
          {composing ? (
            <NewThread
              onCreated={(id) => { setComposing(false); setSelectedId(id); void threads.refetch(); }}
            />
          ) : selectedId ? (
            <Conversation threadId={selectedId} />
          ) : (
            <p className="text-sm text-slate-500">Select a conversation or start a new message.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
