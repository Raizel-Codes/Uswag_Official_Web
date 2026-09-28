import type { UserRole, OfficerPosition } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  officerPosition?: OfficerPosition | null;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}
