import { useMutation, useQuery } from '@tanstack/react-query';
import { aiApi } from './ai.api';
import type { GeneratePayload } from './ai.types';

export const useAiStatus = () =>
  useQuery({ queryKey: ['ai', 'status'], queryFn: aiApi.status });

export const useInsights = () =>
  useQuery({ queryKey: ['ai', 'insights'], queryFn: aiApi.insights });

export const useGenerate = () =>
  useMutation({ mutationFn: (payload: GeneratePayload) => aiApi.generate(payload) });

export const useReportComment = () =>
  useMutation({ mutationFn: (studentId: string) => aiApi.reportComment(studentId) });
