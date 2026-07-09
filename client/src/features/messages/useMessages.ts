import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from './messages.api';
import type { CreateThreadPayload } from './messages.types';

const keys = {
  threads: ['messages', 'threads'] as const,
  thread: (id: string) => ['messages', 'thread', id] as const,
  contacts: ['messages', 'contacts'] as const,
};

export const useThreads = () =>
  useQuery({ queryKey: keys.threads, queryFn: messagesApi.listThreads });

export const useThread = (id: string) =>
  useQuery({ queryKey: keys.thread(id), queryFn: () => messagesApi.getThread(id), enabled: !!id });

export const useContacts = (enabled: boolean) =>
  useQuery({ queryKey: keys.contacts, queryFn: messagesApi.contacts, enabled });

export const useCreateThread = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateThreadPayload) => messagesApi.createThread(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.threads }),
  });
};

export const usePostMessage = (threadId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagesApi.postMessage(threadId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.thread(threadId) });
      void qc.invalidateQueries({ queryKey: keys.threads });
    },
  });
};
