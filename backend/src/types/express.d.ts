import type { UserRole, OfficerPosition } from '@prisma/client';

// Extends Express's Request with the authenticated user attached by
// auth.middleware.ts, so controllers get typed access to req.user.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        officerPosition?: OfficerPosition | null;
        isDeveloper?: boolean;
        mustChangePassword?: boolean;
      };
    }
  }
}

export {};
