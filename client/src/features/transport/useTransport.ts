import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transportApi } from './transport.api';
import type {
  CreateRoutePayload,
  CreateStopPayload,
  CreateVehiclePayload,
  SetAllocationPayload,
} from './transport.types';

const keys = {
  vehicles: ['transport', 'vehicles'] as const,
  routes: ['transport', 'routes'] as const,
  route: (id: string) => ['transport', 'route', id] as const,
};

// Vehicles
export const useVehicles = () =>
  useQuery({ queryKey: keys.vehicles, queryFn: transportApi.listVehicles });

export const useCreateVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehiclePayload) => transportApi.createVehicle(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.vehicles }),
  });
};

export const useDeleteVehicle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportApi.removeVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.vehicles }),
  });
};

// Routes
export const useRoutes = () => useQuery({ queryKey: keys.routes, queryFn: transportApi.listRoutes });

export const useRoute = (id: string) =>
  useQuery({ queryKey: keys.route(id), queryFn: () => transportApi.getRoute(id), enabled: !!id });

export const useCreateRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoutePayload) => transportApi.createRoute(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.routes }),
  });
};

export const useDeleteRoute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportApi.removeRoute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.routes }),
  });
};

// Stops + allocations (refresh the route detail)
const invalidateRoute = (qc: ReturnType<typeof useQueryClient>, routeId: string) => {
  void qc.invalidateQueries({ queryKey: keys.route(routeId) });
  void qc.invalidateQueries({ queryKey: keys.routes });
};

export const useAddStop = (routeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStopPayload) => transportApi.addStop(routeId, payload),
    onSuccess: () => invalidateRoute(qc, routeId),
  });
};

export const useDeleteStop = (routeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stopId: string) => transportApi.removeStop(routeId, stopId),
    onSuccess: () => invalidateRoute(qc, routeId),
  });
};

export const useSetAllocation = (routeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: SetAllocationPayload }) =>
      transportApi.setAllocation(studentId, payload),
    onSuccess: () => invalidateRoute(qc, routeId),
  });
};

export const useRemoveAllocation = (routeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => transportApi.removeAllocation(studentId),
    onSuccess: () => invalidateRoute(qc, routeId),
  });
};
