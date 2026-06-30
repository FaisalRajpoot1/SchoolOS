export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicYearPayload {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}
