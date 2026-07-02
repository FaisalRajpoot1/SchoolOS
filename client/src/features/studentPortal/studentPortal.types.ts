export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  status: string;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
}
