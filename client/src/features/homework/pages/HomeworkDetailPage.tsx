import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDeleteHomework,
  useGradeSubmission,
  useHomework,
  useRecordSubmission,
  useRemoveSubmission,
  useSubmissions,
} from '../useHomework';
import type { HomeworkSubmission } from '../homework.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AttachmentsPanel } from '@/features/attachments/AttachmentsPanel';
import { getApiErrorMessage } from '@/lib/apiError';

interface RowProps {
  homeworkId: string;
  studentId: string;
  name: string;
  admissionNo: string;
  submission: HomeworkSubmission | null;
}

function SubmissionRow({ homeworkId, studentId, name, admissionNo, submission }: RowProps) {
  const record = useRecordSubmission(homeworkId);
  const grade = useGradeSubmission(homeworkId);
  const remove = useRemoveSubmission(homeworkId);
  const [marks, setMarks] = useState(submission?.marks != null ? String(submission.marks) : '');
  const [feedback, setFeedback] = useState(submission?.feedback ?? '');
  const [showFiles, setShowFiles] = useState(false);

  return (
    <>
    <tr className="border-b border-slate-100 last:border-0 align-top">
      <td className="px-4 py-3">
        <p className="font-medium">{name}</p>
        <p className="font-mono text-xs text-slate-500">{admissionNo}</p>
      </td>
      <td className="px-4 py-3">
        {submission ? (
          <div className="text-sm">
            <span className="text-slate-600">{submission.submittedAt.slice(0, 10)}</span>
            {submission.isLate && (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Late
              </span>
            )}
            {submission.gradedAt && submission.marks != null && (
              <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                {submission.marks} marks
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400">Not submitted</span>
        )}
      </td>
      <td className="px-4 py-3">
        {submission ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              placeholder="Marks"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
            />
            <input
              placeholder="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
            />
            <Button
              variant="secondary"
              isLoading={grade.isPending}
              onClick={() =>
                grade.mutate({
                  studentId,
                  payload: { marks: marks === '' ? null : Number(marks), feedback: feedback || undefined },
                })
              }
            >
              Grade
            </Button>
            <Button variant="ghost" isLoading={remove.isPending} onClick={() => remove.mutate(studentId)}>
              Remove
            </Button>
            <Button variant="ghost" onClick={() => setShowFiles((v) => !v)}>
              {showFiles ? 'Hide files' : 'Files'}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            isLoading={record.isPending}
            onClick={() => record.mutate({ studentId, payload: {} })}
          >
            Mark submitted
          </Button>
        )}
      </td>
    </tr>
      {submission && showFiles && (
        <tr className="border-b border-slate-100 last:border-0">
          <td colSpan={3} className="bg-slate-50/50 px-4 py-3">
            <AttachmentsPanel basePath={`/homework/submissions/${submission.id}`} />
          </td>
        </tr>
      )}
    </>
  );
}

export function HomeworkDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const homework = useHomework(id);
  const submissions = useSubmissions(id);
  const deleteHomework = useDeleteHomework();

  if (homework.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (homework.isError || !homework.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(homework.error)}</p>;

  const hw = homework.data;

  const handleDelete = async (): Promise<void> => {
    await deleteHomework.mutateAsync(id);
    navigate('/homework', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/homework" className="text-sm text-brand-600">← Back to homework</Link>
          <h1 className="mt-2 text-2xl font-bold">{hw.title}</h1>
          <p className="text-slate-500">
            {hw.class.name} / {hw.section.name}
            {hw.subject ? ` · ${hw.subject.name}` : ''} · due {hw.dueDate.slice(0, 10)}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} isLoading={deleteHomework.isPending}>
          Delete
        </Button>
      </div>

      {(hw.description || hw.attachmentUrl) && (
        <Card className="space-y-2">
          {hw.description && <p className="text-sm text-slate-700">{hw.description}</p>}
          {hw.attachmentUrl && (
            <a href={hw.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-brand-600 underline">
              Attachment
            </a>
          )}
        </Card>
      )}

      <AttachmentsPanel basePath={`/homework/${id}`} />

      <Card className="p-0">
        <div className="border-b border-slate-200 px-6 py-3 text-sm font-semibold">Submissions</div>
        {submissions.isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : submissions.data && submissions.data.entries.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.data.entries.map((entry) => (
                <SubmissionRow
                  key={entry.student.id}
                  homeworkId={id}
                  studentId={entry.student.id}
                  name={`${entry.student.firstName} ${entry.student.lastName}`}
                  admissionNo={entry.student.admissionNo}
                  submission={entry.submission}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-6 text-sm text-slate-500">No active students in this section.</p>
        )}
      </Card>
    </div>
  );
}
