import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../core/utils/httpResponse";
import Helper from "../core/helpers";
import prisma from "../core/utils/prisma";

export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Authentication token is missing." });
      return;
    }

    const decodedToken = Helper.verifyToken(token);

    if (!decodedToken?.id) {
      res.status(401).json({ message: "Invalid token payload" });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decodedToken.id },
    });

    if (!admin) {
      console.log("[AUTH] → Admin not found for id:", decodedToken.id); 
      res.status(401).json({ message: "Unauthorized access." });
      return;
    }

    (req as any).admin = admin;

    next();
  } catch (error) {
    return next(error);
  }
};
