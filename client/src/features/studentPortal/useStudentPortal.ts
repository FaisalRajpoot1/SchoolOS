import { useQuery } from '@tanstack/react-query';
import { studentPortalApi } from './studentPortal.api';

export const useStudentMe = () =>
  useQuery({ queryKey: ['studentPortal', 'me'], queryFn: studentPortalApi.me });

export const useStudentAttendance = () =>
  useQuery({ queryKey: ['studentPortal', 'attendance'], queryFn: studentPortalApi.attendance });

export const useStudentInvoices = () =>
  useQuery({ queryKey: ['studentPortal', 'invoices'], queryFn: studentPortalApi.invoices });

export const useStudentHomework = () =>
  useQuery({ queryKey: ['studentPortal', 'homework'], queryFn: studentPortalApi.homework });

export const useStudentAssignments = () =>
  useQuery({ queryKey: ['studentPortal', 'assignments'], queryFn: studentPortalApi.assignments });

export const useStudentResults = () =>
  useQuery({ queryKey: ['studentPortal', 'results'], queryFn: studentPortalApi.results });
