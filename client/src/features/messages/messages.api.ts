import { api } from '@/lib/axios';
import type {
  CreateThreadPayload,
  MessageContact,
  ThreadDetail,
  ThreadMessage,
  ThreadSummary,
} from './messages.types';

export const messagesApi = {
  async contacts(): Promise<MessageContact[]> {
    const { data } = await api.get<{ data: MessageContact[] }>('/messages/contacts');
    return data.data;
  },
  async listThreads(): Promise<ThreadSummary[]> {
    const { data } = await api.get<{ data: ThreadSummary[] }>('/messages/threads');
    return data.data;
  },
  async getThread(id: string): Promise<ThreadDetail> {
    const { data } = await api.get<{ data: ThreadDetail }>(`/messages/threads/${id}`);
    return data.data;
  },
  async createThread(payload: CreateThreadPayload): Promise<ThreadSummary> {
    const { data } = await api.post<{ data: { thread: ThreadSummary } }>('/messages/threads', payload);
    return data.data.thread;
  },
  async postMessage(threadId: string, body: string): Promise<ThreadMessage> {
    const { data } = await api.post<{ data: { message: ThreadMessage } }>(
      `/messages/threads/${threadId}/messages`,
      { body },
    );
    return data.data.message;
  },
};
