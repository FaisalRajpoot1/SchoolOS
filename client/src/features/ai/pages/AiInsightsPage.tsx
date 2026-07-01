import { useState } from 'react';
import { useAiStatus, useGenerate, useInsights } from '../useAi';
import type { GenerateKind, RiskType } from '../ai.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { getApiErrorMessage } from '@/lib/apiError';

const REASON_STYLES: Record<RiskType, string> = {
  ATTENDANCE: 'bg-amber-100 text-amber-700',
  PERFORMANCE: 'bg-red-100 text-red-700',
  FEES: 'bg-blue-100 text-blue-700',
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export function AiInsightsPage() {
  const status = useAiStatus();
  const insights = useInsights();
  const generate = useGenerate();

  const [kind, setKind] = useState<GenerateKind>('homework');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [count, setCount] = useState(5);

  const runGenerate = (): void => {
    if (!subject || !topic || !grade) return;
    generate.mutate({ kind, subject, topic, grade, count });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-slate-500">Early-warning insights and content generation.</p>
      </div>

      {status.data && !status.data.aiEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Live AI is not configured. Insights and generated content use the built-in rules engine.
          Set <code className="font-mono">ANTHROPIC_API_KEY</code> on the server to enable Claude-powered output.
        </div>
      )}

      {/* At-risk insights */}
      <Card className="space-y-4">
        <h2 className="font-semibold">Students needing attention</h2>
        {insights.isLoading ? (
          <p className="text-sm text-slate-500">Analyzing…</p>
        ) : insights.isError || !insights.data ? (
          <p className="text-sm text-red-600">{getApiErrorMessage(insights.error)}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Flagged" value={insights.data.summary.totalFlagged} />
              <Stat label="Attendance" value={insights.data.summary.attendanceRisk} />
              <Stat label="Performance" value={insights.data.summary.performanceRisk} />
              <Stat label="Fees" value={insights.data.summary.feeRisk} />
            </div>
            {insights.data.students.length === 0 ? (
              <p className="text-sm text-slate-500">No at-risk students detected. 🎉</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {insights.data.students.map((s) => (
                  <li key={s.studentId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">
                        {s.name} <span className="font-mono text-xs text-slate-400">{s.admissionNo}</span>
                      </p>
                      <p className="text-xs text-slate-500">{s.className}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {s.reasons.map((r) => (
                        <span key={r.type} className={`rounded-full px-2 py-0.5 text-xs font-medium ${REASON_STYLES[r.type]}`}>
                          {r.detail}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>

      {/* Content generator */}
      <Card className="space-y-4">
        <h2 className="font-semibold">Content generator</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as GenerateKind)}>
            <option value="homework">Homework tasks</option>
            <option value="questions">Exam questions</option>
          </Select>
          <TextField label="Grade / Class" placeholder="e.g. Grade 6" value={grade} onChange={(e) => setGrade(e.target.value)} />
          <TextField label="Subject" placeholder="e.g. Science" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <TextField label="Topic" placeholder="e.g. Photosynthesis" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <div>
            <TextField
              label="How many"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <Button disabled={!subject || !topic || !grade} isLoading={generate.isPending} onClick={runGenerate}>
              Generate
            </Button>
          </div>
        </div>
        {generate.isError && <p className="text-sm text-red-600">{getApiErrorMessage(generate.error)}</p>}
        {generate.data && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Result</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${generate.data.source === 'ai' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                {generate.data.source === 'ai' ? 'Claude' : 'Rules engine'}
              </span>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">{generate.data.content}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
