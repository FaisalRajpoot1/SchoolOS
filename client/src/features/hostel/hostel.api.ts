import { api } from '@/lib/axios';
import type {
  CreateHostelPayload,
  CreateRoomPayload,
  HostelDetail,
  HostelListItem,
  HostelRoom,
  SetAllocationPayload,
} from './hostel.types';

export const hostelApi = {
  async list(): Promise<HostelListItem[]> {
    const { data } = await api.get<{ data: HostelListItem[] }>('/hostels');
    return data.data;
  },
  async getById(id: string): Promise<HostelDetail> {
    const { data } = await api.get<{ data: { hostel: HostelDetail } }>(`/hostels/${id}`);
    return data.data.hostel;
  },
  async create(payload: CreateHostelPayload): Promise<HostelDetail> {
    const { data } = await api.post<{ data: { hostel: HostelDetail } }>('/hostels', payload);
    return data.data.hostel;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/hostels/${id}`);
  },

  async addRoom(hostelId: string, payload: CreateRoomPayload): Promise<HostelRoom> {
    const { data } = await api.post<{ data: { room: HostelRoom } }>(
      `/hostels/${hostelId}/rooms`,
      payload,
    );
    return data.data.room;
  },
  async removeRoom(hostelId: string, roomId: string): Promise<void> {
    await api.delete(`/hostels/${hostelId}/rooms/${roomId}`);
  },

  async setAllocation(studentId: string, payload: SetAllocationPayload): Promise<void> {
    await api.put(`/hostels/allocations/${studentId}`, payload);
  },
  async removeAllocation(studentId: string): Promise<void> {
    await api.delete(`/hostels/allocations/${studentId}`);
  },
};
