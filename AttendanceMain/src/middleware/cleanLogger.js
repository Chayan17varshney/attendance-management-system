
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log directory
const logDirectory = path.join(__dirname, "../../logs/cleanedLogs");

// Create a rotating file transport
const transport = new DailyRotateFile({
  dirname: logDirectory,          // Directory where logs will be stored
  filename: "attendance-%DATE%.log",      // File format (date will replace %DATE%)
  datePattern: "YYYY-MM-DD",       // Rotate daily
  zippedArchive: true,             // Compress old log files
  maxSize: "10m",                  // Max size per log file (optional)
  maxFiles: "30d",                  // Keep logs for 7 days (optional)
});

// Create a Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [transport], // Use the rotating transport
});

const cleanLoggerMiddleware = async (req, res, next) => {
  // console.log(req.url.includes("signIn"));
  if (
    !req.url.includes("signIn") &&
    !req.url.includes("signUp") &&
    !req.url.includes("changePassword")
  ) {
    const date = new Date();
    const logData = `${req.url}-${JSON.stringify(req.body)}-DateTime ${date} ip:${req.headers["x-forwarded-for"]} method:${req.method}`;
    logger.info(logData);
  }
  next();
};
export default cleanLoggerMiddleware;

