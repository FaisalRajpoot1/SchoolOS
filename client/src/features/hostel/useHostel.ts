import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hostelApi } from './hostel.api';
import type { CreateHostelPayload, CreateRoomPayload, SetAllocationPayload } from './hostel.types';

const keys = {
  hostels: ['hostels'] as const,
  hostel: (id: string) => ['hostels', 'detail', id] as const,
};

export const useHostels = () => useQuery({ queryKey: keys.hostels, queryFn: hostelApi.list });

export const useHostel = (id: string) =>
  useQuery({ queryKey: keys.hostel(id), queryFn: () => hostelApi.getById(id), enabled: !!id });

export const useCreateHostel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHostelPayload) => hostelApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.hostels }),
  });
};

export const useDeleteHostel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hostelApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.hostels }),
  });
};

const invalidateHostel = (qc: ReturnType<typeof useQueryClient>, hostelId: string) => {
  void qc.invalidateQueries({ queryKey: keys.hostel(hostelId) });
  void qc.invalidateQueries({ queryKey: keys.hostels });
};

export const useAddRoom = (hostelId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => hostelApi.addRoom(hostelId, payload),
    onSuccess: () => invalidateHostel(qc, hostelId),
  });
};

export const useDeleteRoom = (hostelId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => hostelApi.removeRoom(hostelId, roomId),
    onSuccess: () => invalidateHostel(qc, hostelId),
  });
};

export const useSetHostelAllocation = (hostelId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: SetAllocationPayload }) =>
      hostelApi.setAllocation(studentId, payload),
    onSuccess: () => invalidateHostel(qc, hostelId),
  });
};

export const useRemoveHostelAllocation = (hostelId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => hostelApi.removeAllocation(studentId),
    onSuccess: () => invalidateHostel(qc, hostelId),
  });
};
