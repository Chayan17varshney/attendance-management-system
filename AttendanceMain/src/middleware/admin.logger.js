import fs from "fs";
import winston from "winston";
const fsPromise = fs.promises;
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "request-logging" },
  transports: [new winston.transports.File({ filename: "adminlogs.txt" })],
});

const adminLoggerMiddleware = async (req, res, next) => {
  // console.log(req.url.includes("signIn"));
  if (
    req.url.includes("https://att-stu.manit.ac.in/api/admin")
  ) {
    const date = new Date();
    const logData = `${req.url}-${JSON.stringify(req.body)}-DateTime ${date}`;
    logger.info(logData);
  }
  next();
};
export default adminLoggerMiddleware;
