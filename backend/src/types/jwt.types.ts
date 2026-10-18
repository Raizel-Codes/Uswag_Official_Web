import type { UserRole, OfficerPosition } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // user id
  role: UserRole;
  officerPosition?: OfficerPosition | null;
  // Claims that only ever RESTRICT (auth.middleware.ts), so trusting a signed token for them is safe.
  dev?: boolean; // the developer's view-only account
  mcp?: boolean; // must choose a new password before anything else
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
}
