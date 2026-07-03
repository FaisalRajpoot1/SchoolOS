import { api } from '@/lib/axios';
import { downloadFile } from '@/lib/download';
import type {
  CreateDocumentPayload,
  DocumentItem,
  ListDocumentsParams,
  PaginationMeta,
} from './documents.types';

export const documentsApi = {
  async list(
    params: ListDocumentsParams,
  ): Promise<{ items: DocumentItem[]; meta: PaginationMeta }> {
    const { data } = await api.get<{ data: DocumentItem[]; meta: PaginationMeta }>('/documents', {
      params,
    });
    return { items: data.data, meta: data.meta };
  },
  async create(payload: CreateDocumentPayload): Promise<DocumentItem> {
    const form = new FormData();
    form.append('file', payload.file);
    form.append('title', payload.title);
    form.append('category', payload.category);
    if (payload.studentId) form.append('studentId', payload.studentId);
    if (payload.employeeId) form.append('employeeId', payload.employeeId);
    // Unset the instance's default JSON Content-Type so the browser sets
    // multipart/form-data with the correct boundary.
    const { data } = await api.post<{ data: { document: DocumentItem } }>('/documents', form, {
      headers: { 'Content-Type': undefined },
    });
    return data.data.document;
  },
  async download(doc: Pick<DocumentItem, 'id' | 'originalName'>): Promise<void> {
    await downloadFile(`/documents/${doc.id}/download`, doc.originalName);
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};
