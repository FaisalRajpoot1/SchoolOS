interface StudentRef {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export interface Vehicle {
  id: string;
  registrationNo: string;
  model: string | null;
  capacity: number;
  driverName: string | null;
  driverPhone: string | null;
  isActive: boolean;
  _count?: { routes: number };
}

export interface RouteStop {
  id: string;
  name: string;
  sequence: number;
  pickupMinute: number | null;
}

export interface TransportAllocation {
  id: string;
  student: StudentRef;
  route?: { id: string; name: string };
  stop: { id: string; name: string } | null;
}

export interface RouteListItem {
  id: string;
  name: string;
  fee: number;
  vehicle: { id: string; registrationNo: string } | null;
  _count: { stops: number; allocations: number };
}

export interface RouteDetail {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  vehicle: { id: string; registrationNo: string; model: string | null } | null;
  stops: RouteStop[];
  allocations: TransportAllocation[];
}

export interface CreateVehiclePayload {
  registrationNo: string;
  model?: string;
  capacity: number;
  driverName?: string;
  driverPhone?: string;
}

export interface CreateRoutePayload {
  name: string;
  description?: string;
  fee: number;
  vehicleId?: string;
}

export interface CreateStopPayload {
  name: string;
  sequence: number;
  pickupMinute?: number;
}

export interface SetAllocationPayload {
  routeId: string;
  stopId?: string;
}
