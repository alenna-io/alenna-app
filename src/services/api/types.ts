export interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  language?: string;
  schoolId: string;
  schoolName: string;
  schoolLogoUrl?: string;
  studentId?: string | null;
  createdPassword?: boolean;
  studentProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    birthDate: string;
    graduationDate: string;
    certificationType?: string;
    contactPhone?: string;
    isLeveled: boolean;
    expectedLevel?: string;
    address?: string;
    parents: Array<{ id: string; name: string }>;
  } | null;
  roles: Array<{
    id: string;
    name: string;
    displayName?: string;
  }>;
  permissions?: string[];
  modules?: Array<{
    id: string;
    key: string;
    name: string;
    description?: string;
    displayOrder?: number;
    actions?: string[];
  }>;
}
