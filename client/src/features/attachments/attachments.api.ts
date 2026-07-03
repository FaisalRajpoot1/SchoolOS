import { api } from '@/lib/axios';
import { downloadFile } from '@/lib/download';

export interface Attachment {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: { id: string; firstName: string; lastName: string } | null;
}

/**
 * Attachments hang off a task at `basePath` (e.g. `/homework/<id>` or
 * `/assignments/<id>`); all endpoints are nested under `${basePath}/attachments`.
 */
export const attachmentsApi = {
  async list(basePath: string): Promise<Attachment[]> {
    const { data } = await api.get<{ data: Attachment[] }>(`${basePath}/attachments`);
    return data.data;
  },
  async upload(basePath: string, file: File): Promise<Attachment> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<{ data: { attachment: Attachment } }>(
      `${basePath}/attachments`,
      form,
      { headers: { 'Content-Type': undefined } },
    );
    return data.data.attachment;
  },
  async download(basePath: string, att: Pick<Attachment, 'id' | 'originalName'>): Promise<void> {
    await downloadFile(`${basePath}/attachments/${att.id}`, att.originalName);
  },
  async remove(basePath: string, attachmentId: string): Promise<void> {
    await api.delete(`${basePath}/attachments/${attachmentId}`);
  },
};
