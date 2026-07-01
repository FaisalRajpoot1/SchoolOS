import { useQuery } from '@tanstack/react-query';
import { portalApi } from './portal.api';

export const usePortalMe = () =>
  useQuery({ queryKey: ['portal', 'me'], queryFn: portalApi.me });

export const useChildAttendance = (studentId: string) =>
  useQuery({
    queryKey: ['portal', 'attendance', studentId],
    queryFn: () => portalApi.attendance(studentId),
    enabled: !!studentId,
  });

export const useChildInvoices = (studentId: string) =>
  useQuery({
    queryKey: ['portal', 'invoices', studentId],
    queryFn: () => portalApi.invoices(studentId),
    enabled: !!studentId,
  });

export const useChildHomework = (studentId: string) =>
  useQuery({
    queryKey: ['portal', 'homework', studentId],
    queryFn: () => portalApi.homework(studentId),
    enabled: !!studentId,
  });

export const useChildAssignments = (studentId: string) =>
  useQuery({
    queryKey: ['portal', 'assignments', studentId],
    queryFn: () => portalApi.assignments(studentId),
    enabled: !!studentId,
  });

export const useChildResults = (studentId: string) =>
  useQuery({
    queryKey: ['portal', 'results', studentId],
    queryFn: () => portalApi.results(studentId),
    enabled: !!studentId,
  });
