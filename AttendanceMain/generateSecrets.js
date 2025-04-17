import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config(); // Load existing environment variables

const envPath = ".env";

// Check if secrets already exist
if (!process.env.JWT_SECRET_ADMIN || !process.env.JWT_SECRET_TEACHER) {
  const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || uuidv4();
  const JWT_SECRET_TEACHER = process.env.JWT_SECRET_TEACHER || uuidv4();

  // Update or create .env file
  const envData = `JWT_SECRET_ADMIN=${JWT_SECRET_ADMIN}\nJWT_SECRET_TEACHER=${JWT_SECRET_TEACHER}\n`;
  fs.writeFileSync(envPath, envData, { flag: "w" });

  console.log("✅ Secrets generated and saved.");
} else {
  console.log("✅ Secrets already exist.");
}
