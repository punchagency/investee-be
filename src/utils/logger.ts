import pino from "pino";

const devTransport = {
  targets: [
    {
      target: "pino-pretty",
      options: {
        colorize: process.env.NODE_ENV !== "production",
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  ],
};

const transport = devTransport;

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: transport,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
