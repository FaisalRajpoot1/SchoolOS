import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBook, useDeleteBook, useIssueBook, useReturnBook } from '../useLibrary';
import { useStudents } from '@/features/students/useStudents';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { getApiErrorMessage } from '@/lib/apiError';

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );
}

export function BookDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const book = useBook(id);
  const students = useStudents({ limit: 100, status: 'ACTIVE' });
  const issueBook = useIssueBook(id);
  const returnBook = useReturnBook();
  const deleteBook = useDeleteBook();

  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState('');

  if (book.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (book.isError || !book.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(book.error)}</p>;

  const b = book.data;

  const handleDelete = async (): Promise<void> => {
    await deleteBook.mutateAsync(id);
    navigate('/library', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/library" className="text-sm text-brand-600">← Back to library</Link>
          <h1 className="mt-2 text-2xl font-bold">{b.title}</h1>
          <p className="text-slate-500">{b.author ?? 'Unknown author'}</p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteBook.isPending}>Delete</Button>
      </div>

      <Card className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Detail label="ISBN" value={b.isbn} />
        <Detail label="Publisher" value={b.publisher} />
        <Detail label="Category" value={b.category?.name ?? null} />
        <Detail label="Shelf" value={b.shelf} />
        <Detail label="Available" value={`${b.availableCopies} / ${b.totalCopies}`} />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Issue a copy</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.data?.items.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <label className="text-sm font-medium text-slate-700">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500" />
          </div>
          <Button
            disabled={!studentId || !dueDate || b.availableCopies < 1}
            isLoading={issueBook.isPending}
            onClick={() => {
              issueBook.mutate({ studentId, dueDate });
              setStudentId('');
              setDueDate('');
            }}
          >
            Issue
          </Button>
        </div>
        {b.availableCopies < 1 && <p className="text-sm text-amber-700">No copies available.</p>}
        {issueBook.isError && <p className="text-sm text-red-600">{getApiErrorMessage(issueBook.error)}</p>}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Currently issued</h2>
        {b.issues.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {b.issues.map((issue) => (
              <li key={issue.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">{issue.student.firstName} {issue.student.lastName}</span>
                  <span className="ml-2 text-xs text-slate-500">due {issue.dueDate.slice(0, 10)}</span>
                </div>
                <Button variant="secondary" isLoading={returnBook.isPending && returnBook.variables === issue.id} onClick={() => returnBook.mutate(issue.id)}>
                  Return
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No copies currently issued.</p>
        )}
      </Card>
    </div>
  );
}
