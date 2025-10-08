import express, { Express } from "express";
import "express-async-errors";
import cors from "cors";
import BaseRouter from "../../routes";
import { notFound } from "../../middlewares/error.middleware";
import prisma from "../utils/prisma";
import morgan from "morgan";
import helmet from "helmet";
import { logger } from "../helpers/logger";
import { errorHandler } from "../../middlewares/error";
import AgentCreditCron from "../../credeitAgetCron";

export const CreateServer = async (): Promise<Express> => {    
  const app = express();
 
  const PORT = process.env.PORT || 3000;

  try {
    await prisma.$connect();
    logger.info("Prisma connected to database");
  } catch (error) {
    console.log(error)
    logger.error("Failed to connect to database:", error);
    process.exit(1);
  }

  AgentCreditCron.schedule(); 
  logger.info("Agent crediting cron job scheduled");

  app.use(
    cors({
      origin: true,
      optionsSuccessStatus: 200,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  if (process.env.NODE_ENV === "development") {
    app.use(
      morgan(":method :status :url :res[content-length] - :response-time ms", {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );
  }

  if (process.env.NODE_ENV === "production") {
    app.use(helmet());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.get("/", (req, res, _next) => {
    res.status(200).json({
      message: "Homeyhost API is running",
    });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
    });    
  });

  app.get("/api/v1", (_req, res) => {
    res.status(200).json({
      message: "Homeyhost API v1 is running",
    }); 
  });

  app.use("/api/v1", BaseRouter);
  app.use(notFound);  

  const server = app.listen(PORT, () => {
    logger.info(`Homeyhost server serving on port http://localhost:${PORT}`);

    logger.info(`[server]: Server is running at http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. shutting down gracefully....`);

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  app.use(errorHandler);

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return app;
};
