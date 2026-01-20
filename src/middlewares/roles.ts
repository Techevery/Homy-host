import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Role as PrismaRole } from '@prisma/client';

const prisma = new PrismaClient();

export enum Role {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: Role;
  };
}

// Simple role checker middleware factory
export const restrictTo = (...allowedRoles: Role[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log("[RBAC] → Checking route:", req.originalUrl);
    console.log("[RBAC] → req.admin exists?", !!req.admin);
    if (req.admin) {
      console.log("[RBAC] → req.admin.role:", req.admin.role);
    }

    if (!req.admin) {
      console.log("[RBAC] → No req.admin → returning 401");
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // ... rest unchanged
  };
};

export function asAppRole(prismaRole: PrismaRole): Role {
  // Safe because values are identical
  return prismaRole as unknown as Role;
}

// Optional: middleware to attach admin to req (after JWT/auth middleware)
export const attachAdminToRequest = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // Assuming you already have JWT verification middleware that puts adminId in req.user or similar
  const adminId = (req as any).user?.id; // adjust according to your JWT payload

  if (!adminId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, role: true },
    });

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    req.admin = {
  id: admin.id,
  email: admin.email,
  role: asAppRole(admin.role),   // convert once
};
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};