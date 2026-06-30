import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDeleteExam, useExam, useSetExamPublished, useUpdateExamSubject } from '../useExams';
import type { ExamSubject } from '../exams.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

function SubjectRow({ examId, examSubject }: { examId: string; examSubject: ExamSubject }) {
  const update = useUpdateExamSubject(examId);
  const [maxMarks, setMaxMarks] = useState(String(examSubject.maxMarks));
  const [passMarks, setPassMarks] = useState(String(examSubject.passMarks));
  const [examDate, setExamDate] = useState(examSubject.examDate?.slice(0, 10) ?? '');

  const dirty =
    maxMarks !== String(examSubject.maxMarks) ||
    passMarks !== String(examSubject.passMarks) ||
    examDate !== (examSubject.examDate?.slice(0, 10) ?? '');

  const numberInput = 'w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500';

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium">{examSubject.subject.name}</p>
        <p className="font-mono text-xs text-slate-400">{examSubject.subject.code}</p>
      </td>
      <td className="px-4 py-3">
        <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} className={numberInput} />
      </td>
      <td className="px-4 py-3">
        <input type="number" value={passMarks} onChange={(e) => setPassMarks(e.target.value)} className={numberInput} />
      </td>
      <td className="px-4 py-3">
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <Button
              variant="secondary"
              isLoading={update.isPending}
              onClick={() =>
                update.mutate({
                  examSubjectId: examSubject.id,
                  payload: {
                    maxMarks: Number(maxMarks),
                    passMarks: Number(passMarks),
                    examDate: examDate || null,
                  },
                })
              }
            >
              Save
            </Button>
          )}
          <Link to={`/exams/${examId}/subjects/${examSubject.id}/marks`}>
            <Button variant="ghost">Enter marks ({examSubject._count.marks})</Button>
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function ExamDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const exam = useExam(id);
  const setPublished = useSetExamPublished(id);
  const deleteExam = useDeleteExam();

  if (exam.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (exam.isError || !exam.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(exam.error)}</p>;

  const e = exam.data;
  const isPublished = e.status === 'PUBLISHED';

  const handleDelete = async (): Promise<void> => {
    await deleteExam.mutateAsync(id);
    navigate('/exams', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/exams" className="text-sm text-brand-600">← Back to exams</Link>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold">
            {e.name}
            <span
              className={
                isPublished
                  ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                  : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
              }
            >
              {e.status}
            </span>
          </h1>
          <p className="text-slate-500">
            {e.class.name}
            {e.academicYear ? ` · ${e.academicYear.name}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/exams/${id}/results`}>
            <Button variant="secondary">View results</Button>
          </Link>
          <Button
            variant={isPublished ? 'secondary' : 'primary'}
            isLoading={setPublished.isPending}
            onClick={() => setPublished.mutate(!isPublished)}
          >
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleteExam.isPending}>
            Delete
          </Button>
        </div>
      </div>

      <Card className="p-0">
        {e.examSubjects.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            This exam has no subjects — the class had no offered subjects when it was created.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Max</th>
                <th className="px-4 py-3">Pass</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {e.examSubjects.map((es) => (
                <SubjectRow key={es.id} examId={id} examSubject={es} />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
