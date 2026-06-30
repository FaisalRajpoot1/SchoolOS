import { Link, useParams } from 'react-router-dom';
import { useExamResults } from '../useExams';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/apiError';

export function ExamResultsPage() {
  const { id = '' } = useParams();
  const results = useExamResults(id);

  if (results.isLoading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (results.isError || !results.data)
    return <p className="text-sm text-red-600">{getApiErrorMessage(results.error)}</p>;

  const r = results.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to={`/exams/${id}`} className="text-sm text-brand-600">← Back to exam</Link>
        <h1 className="mt-2 text-2xl font-bold">{r.exam.name} — Results</h1>
        <p className="text-slate-500">
          {r.subjectCount} subjects · total {r.totalMax} marks
        </p>
      </div>

      <Card className="p-0">
        {r.results.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No students to rank.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3 text-right">Obtained</th>
                <th className="px-6 py-3 text-right">%</th>
                <th className="px-6 py-3">Grade</th>
                <th className="px-6 py-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {r.results.map((row) => (
                <tr key={row.student.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-6 py-3 font-semibold tabular-nums">{row.rank}</td>
                  <td className="px-6 py-3">
                    <span className="font-medium">{row.student.firstName} {row.student.lastName}</span>
                    <span className="ml-2 font-mono text-xs text-slate-400">{row.student.admissionNo}</span>
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums">{row.obtained} / {row.totalMax}</td>
                  <td className="px-6 py-3 text-right tabular-nums">{row.percentage}%</td>
                  <td className="px-6 py-3 font-semibold">{row.grade}</td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        row.passed
                          ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700'
                          : 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700'
                      }
                    >
                      {row.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
