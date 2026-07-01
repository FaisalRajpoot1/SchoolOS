import { api } from '@/lib/axios';
import type {
  CreateRoutePayload,
  CreateStopPayload,
  CreateVehiclePayload,
  RouteDetail,
  RouteListItem,
  RouteStop,
  SetAllocationPayload,
  TransportAllocation,
  Vehicle,
} from './transport.types';

export const transportApi = {
  // Vehicles
  async listVehicles(): Promise<Vehicle[]> {
    const { data } = await api.get<{ data: Vehicle[] }>('/transport/vehicles');
    return data.data;
  },
  async createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
    const { data } = await api.post<{ data: { vehicle: Vehicle } }>('/transport/vehicles', payload);
    return data.data.vehicle;
  },
  async removeVehicle(id: string): Promise<void> {
    await api.delete(`/transport/vehicles/${id}`);
  },

  // Routes
  async listRoutes(): Promise<RouteListItem[]> {
    const { data } = await api.get<{ data: RouteListItem[] }>('/transport/routes');
    return data.data;
  },
  async getRoute(id: string): Promise<RouteDetail> {
    const { data } = await api.get<{ data: { route: RouteDetail } }>(`/transport/routes/${id}`);
    return data.data.route;
  },
  async createRoute(payload: CreateRoutePayload): Promise<RouteDetail> {
    const { data } = await api.post<{ data: { route: RouteDetail } }>('/transport/routes', payload);
    return data.data.route;
  },
  async removeRoute(id: string): Promise<void> {
    await api.delete(`/transport/routes/${id}`);
  },

  // Stops
  async addStop(routeId: string, payload: CreateStopPayload): Promise<RouteStop> {
    const { data } = await api.post<{ data: { stop: RouteStop } }>(
      `/transport/routes/${routeId}/stops`,
      payload,
    );
    return data.data.stop;
  },
  async removeStop(routeId: string, stopId: string): Promise<void> {
    await api.delete(`/transport/routes/${routeId}/stops/${stopId}`);
  },

  // Allocations
  async setAllocation(studentId: string, payload: SetAllocationPayload): Promise<TransportAllocation> {
    const { data } = await api.put<{ data: { allocation: TransportAllocation } }>(
      `/transport/allocations/${studentId}`,
      payload,
    );
    return data.data.allocation;
  },
  async removeAllocation(studentId: string): Promise<void> {
    await api.delete(`/transport/allocations/${studentId}`);
  },
};
