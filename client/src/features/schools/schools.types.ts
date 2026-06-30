export interface School {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  timezone: string;
  currency: string;
  locale: string;
  themeColor: string;
  dayStartMinute: number;
  dayEndMinute: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateSchoolPayload {
  name: string;
  email?: string;
  phone?: string;
  admin: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
}

/** Editable subset of a school profile. */
export type UpdateSchoolPayload = Partial<
  Pick<
    School,
    | 'name'
    | 'email'
    | 'phone'
    | 'logoUrl'
    | 'websiteUrl'
    | 'address'
    | 'city'
    | 'state'
    | 'country'
    | 'postalCode'
    | 'timezone'
    | 'currency'
    | 'locale'
    | 'themeColor'
    | 'dayStartMinute'
    | 'dayEndMinute'
  >
>;

export interface ListSchoolsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
