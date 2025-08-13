import { Request, Response, NextFunction } from "express";
import HttpStatusCode from "../core/utils/httpResponse";
import Helper from "../core/helpers";
import prisma from "../core/utils/prisma";

export const authenticateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer", "").trim();

    if (!token) {
      res
        .status(HttpStatusCode.HTTP_BAD_REQUEST)
        .json({ message: "Authorization token is missing" });

      return;
    }

    const decodedToken = Helper.verifyToken(token);

    const agent = await prisma.agent.findUnique({
      where: { id: decodedToken?.id },
    });

    if (!agent) {
      res
        .status(HttpStatusCode.HTTP_UNAUTHORIZED)
        .json({ message: "UNAUTHORIZED ACCESS" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).agent = agent;

    next();
  } catch (error) {
    res
      .status(HttpStatusCode.HTTP_UNAUTHORIZED)
      .json({ message: "Authentication failed", details: error });
  }
};
