// User, role, and session shapes.
// Role scope boundaries are documented in claude.md — do not add roles
// without a corresponding Constitution amendment (Article IX).

export type UserRole = 'super_admin' | 'officer_admin' | 'member';

export type OfficerPosition =
  | 'president'
  | 'vice_president'
  | 'secretary'
  | 'treasurer'
  | 'auditor'
  | 'business_manager'
  | 'pro';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  officerPosition?: OfficerPosition; // only present when role === 'officer_admin' | 'super_admin'
  collegeOrDept: string;
  navStyle: 'auto' | 'bottom' | 'sidebar';
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
