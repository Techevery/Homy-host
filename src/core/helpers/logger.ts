import pino from "pino";
import { LOG_LEVELS, ENVIRONMENTS } from "../shared/constants/logger";

const currentEnv = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

const logLevel =
  currentEnv === ENVIRONMENTS.PRODUCTION ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

export const logger = pino({
  level: logLevel,
  transport:
    currentEnv !== ENVIRONMENTS.PRODUCTION
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});
