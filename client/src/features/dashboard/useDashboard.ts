import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { DashboardOverview, TeacherOverview } from './dashboard.types';

const fetchOverview = async (): Promise<DashboardOverview> => {
  const { data } = await api.get<{ data: DashboardOverview }>('/dashboard');
  return data.data;
};

export const useDashboard = (enabled: boolean) =>
  useQuery({ queryKey: ['dashboard', 'overview'], queryFn: fetchOverview, enabled });

const fetchTeacherOverview = async (): Promise<TeacherOverview> => {
  const { data } = await api.get<{ data: TeacherOverview }>('/dashboard/teacher');
  return data.data;
};

export const useTeacherDashboard = (enabled: boolean) =>
  useQuery({ queryKey: ['dashboard', 'teacher'], queryFn: fetchTeacherOverview, enabled });
