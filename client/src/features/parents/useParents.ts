import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parentsApi } from './parents.api';
import type { CreateParentPayload, ListParentsParams, ParentDetail } from './parents.types';

const keys = {
  all: ['parents'] as const,
  list: (params: ListParentsParams) => ['parents', 'list', params] as const,
  detail: (id: string) => ['parents', 'detail', id] as const,
};

export const useParents = (params: ListParentsParams) =>
  useQuery({ queryKey: keys.list(params), queryFn: () => parentsApi.list(params) });

export const useParent = (id: string) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => parentsApi.getById(id), enabled: !!id });

export const useCreateParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateParentPayload) => parentsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteParent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => parentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

const syncDetail = (qc: ReturnType<typeof useQueryClient>, id: string) => (parent: ParentDetail) => {
  qc.setQueryData(keys.detail(id), parent);
  void qc.invalidateQueries({ queryKey: keys.all });
};

export const useLinkChild = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, relation }: { studentId: string; relation?: string }) =>
      parentsApi.linkChild(id, studentId, relation),
    onSuccess: syncDetail(qc, id),
  });
};

export const useUnlinkChild = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => parentsApi.unlinkChild(id, studentId),
    onSuccess: syncDetail(qc, id),
  });
};
