import { useRef, useState } from 'react';
import { useStudents } from '@/features/students/useStudents';
import { useTeacherOptions } from '@/features/teachers/useTeachers';
import { useSubjects } from '@/features/academics/useAcademics';
import { useDeleteDocument, useDocuments, useUploadDocument } from '../useDocuments';
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type DocumentItem,
} from '../documents.types';
import { documentsApi } from '../documents.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { getApiErrorMessage } from '@/lib/apiError';
import { toast } from '@/lib/toast';

const categoryBadge: Record<DocumentCategory, string> = {
  GENERAL: 'bg-slate-100 text-slate-600',
  ID_PROOF: 'bg-blue-50 text-blue-700',
  CERTIFICATE: 'bg-green-50 text-green-700',
  REPORT: 'bg-purple-50 text-purple-700',
  MEDICAL: 'bg-red-50 text-red-700',
  CONTRACT: 'bg-amber-50 text-amber-700',
  OTHER: 'bg-slate-100 text-slate-600',
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentsPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('GENERAL');
  const [file, setFile] = useState<File | null>(null);
  const [ownerType, setOwnerType] = useState<'none' | 'student' | 'teacher' | 'subject'>('none');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('');
  const [page, setPage] = useState(1);
  const fileInput = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState('');

  const students = useStudents({ limit: 20, search: studentSearch || undefined });
  const teachers = useTeacherOptions();
  const subjects = useSubjects();
  const list = useDocuments({ page, limit: 10, category: categoryFilter || undefined });
  const upload = useUploadDocument();
  const remove = useDeleteDocument();
  const meta = list.data?.meta;

  const onUpload = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    if (!title.trim()) {
      toast.error('A title is required');
      return;
    }
    upload.mutate(
      {
        file,
        title: title.trim(),
        category,
        studentId: ownerType === 'student' ? studentId || undefined : undefined,
        teacherId: ownerType === 'teacher' ? teacherId || undefined : undefined,
        subjectId: ownerType === 'subject' ? subjectId || undefined : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Document uploaded');
          setTitle('');
          setCategory('GENERAL');
          setFile(null);
          setOwnerType('none');
          setStudentId('');
          setStudentSearch('');
          setTeacherId('');
          setSubjectId('');
          if (fileInput.current) fileInput.current.value = '';
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const doDownload = (doc: DocumentItem): void => {
    setDownloadingId(doc.id);
    documentsApi
      .download(doc)
      .catch((err: unknown) => toast.error(getApiErrorMessage(err, 'Could not download the file')))
      .finally(() => setDownloadingId(''));
  };

  const doDelete = (id: string): void => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    remove.mutate(id, {
      onSuccess: () => toast.success('Document deleted'),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-slate-500">Secure document store for students, teachers, and the school.</p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Upload a document</h2>
        <form onSubmit={onUpload} className="space-y-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-[16rem]">
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="w-44">
              <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
                {DOCUMENT_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-44">
              <Select
                label="Attach to"
                value={ownerType}
                onChange={(e) => {
                  setOwnerType(e.target.value as 'none' | 'student' | 'teacher' | 'subject');
                  setStudentId('');
                  setTeacherId('');
                  setSubjectId('');
                }}
              >
                <option value="none">School-level</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="subject">Subject</option>
              </Select>
            </div>
            {ownerType === 'student' && (
              <>
                <div className="w-64">
                  <TextField
                    label="Find student"
                    placeholder="Search by name or admission no."
                    value={studentSearch}
                    onChange={(e) => { setStudentSearch(e.target.value); setStudentId(''); }}
                  />
                </div>
                <div className="w-72">
                  <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                    <option value="">Select</option>
                    {students.data?.items.map((s) => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
                    ))}
                  </Select>
                </div>
              </>
            )}
            {ownerType === 'teacher' && (
              <div className="w-72">
                <Select label="Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                  <option value="">Select</option>
                  {teachers.data?.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </Select>
              </div>
            )}
            {ownerType === 'subject' && (
              <div className="w-72">
                <Select label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">Select</option>
                  {subjects.data?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">File</label>
            <input
              ref={fileInput}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="mt-1 text-xs text-slate-400">PDF, images, or Office/CSV/TXT files.</p>
          </div>
          <Button type="submit" isLoading={upload.isPending}>Upload</Button>
        </form>
      </Card>

      <Card className="flex flex-wrap items-end gap-3">
        <div className="w-52">
          <Select
            label="Filter by category"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value as DocumentCategory | ''); setPage(1); }}
          >
            <option value="">All categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </Select>
        </div>
      </Card>

      <Card className="p-0">
        {list.isLoading ? (
          <Spinner />
        ) : list.isError ? (
          <p className="p-6 text-sm text-red-600">{getApiErrorMessage(list.error)}</p>
        ) : list.data && list.data.items.length === 0 ? (
          <EmptyState title="No documents" description="Uploaded documents will appear here." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Attached to</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-slate-400">{d.originalName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryBadge[d.category]}`}>
                      {d.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.student
                      ? `${d.student.firstName} ${d.student.lastName}`
                      : d.teacher
                        ? `${d.teacher.firstName} ${d.teacher.lastName} (teacher)`
                        : d.employee
                          ? `${d.employee.firstName} ${d.employee.lastName}`
                          : d.subject
                            ? `${d.subject.name} (subject)`
                            : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-500">{formatBytes(d.sizeBytes)}</td>
                  <td className="px-4 py-3 text-slate-500">{d.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="py-1"
                        onClick={() => doDownload(d)}
                        isLoading={downloadingId === d.id}
                      >
                        Download
                      </Button>
                      <Button
                        variant="danger"
                        className="py-1"
                        onClick={() => doDelete(d.id)}
                        isLoading={remove.isPending && remove.variables === d.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={!meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
