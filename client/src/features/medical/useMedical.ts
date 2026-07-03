import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { medicalApi } from './medical.api';
import type { CreateVisitPayload, ListVisitsParams, UpsertProfilePayload } from './medical.types';

const keys = {
  profile: (studentId: string) => ['medical', 'profile', studentId] as const,
  visits: (params: ListVisitsParams) => ['medical', 'visits', params] as const,
};

export const useMedicalProfile = (studentId: string) =>
  useQuery({
    queryKey: keys.profile(studentId),
    queryFn: () => medicalApi.getProfile(studentId),
    enabled: !!studentId,
  });

export const useUpsertProfile = (studentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertProfilePayload) => medicalApi.upsertProfile(studentId, payload),
    onSuccess: (profile) => qc.setQueryData(keys.profile(studentId), profile),
  });
};

export const useInfirmaryVisits = (params: ListVisitsParams, enabled = true) =>
  useQuery({
    queryKey: keys.visits(params),
    queryFn: () => medicalApi.listVisits(params),
    enabled,
  });

export const useCreateVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitPayload) => medicalApi.createVisit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'visits'] }),
  });
};

export const useDeleteVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicalApi.removeVisit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['medical', 'visits'] }),
  });
};
