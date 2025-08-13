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
      res
        .status(HttpStatusCode.HTTP_UNAUTHORIZED)
        .json({ message: "Authentication token is missing." });

      return;
    }

    const decodedToken = Helper.verifyToken(token);

    const admin = await prisma.admin.findUnique({
      where: { id: decodedToken?.id },
    });

    if (!admin) {
      res
        .status(HttpStatusCode.HTTP_UNAUTHORIZED)
        .json({ message: "Unauthorized access." });

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).admin = admin;

    next();
  } catch (error) {
    return next(error);
  }
};
