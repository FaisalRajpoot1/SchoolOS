export type HostelType = 'BOYS' | 'GIRLS' | 'MIXED';

export const HOSTEL_TYPES: HostelType[] = ['BOYS', 'GIRLS', 'MIXED'];

interface StudentRef {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export interface HostelAllocation {
  id: string;
  bedLabel: string | null;
  student: StudentRef;
}

export interface HostelRoom {
  id: string;
  roomNumber: string;
  floor: string | null;
  capacity: number;
  allocations: HostelAllocation[];
}

export interface HostelListItem {
  id: string;
  name: string;
  type: HostelType;
  wardenName: string | null;
  monthlyFee: number;
  roomCount: number;
  totalBeds: number;
  occupied: number;
}

export interface HostelDetail {
  id: string;
  name: string;
  type: HostelType;
  wardenName: string | null;
  wardenPhone: string | null;
  monthlyFee: number;
  rooms: HostelRoom[];
}

export interface CreateHostelPayload {
  name: string;
  type: HostelType;
  wardenName?: string;
  monthlyFee: number;
}

export interface CreateRoomPayload {
  roomNumber: string;
  floor?: string;
  capacity: number;
}

export interface SetAllocationPayload {
  roomId: string;
  bedLabel?: string;
}
