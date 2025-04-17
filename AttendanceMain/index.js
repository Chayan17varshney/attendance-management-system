import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import geoip from "geoip-lite";
import swagger from "swagger-ui-express";
import userRoute from "./src/features/user/user.routes.js";
import timetableRoutes from "./src/features/timetable/timetable.routes.js";
import subjectRoute from "./src/features/subject/subject.routes.js";
import AttendanceRoute from "./src/features/attendance/attendance.routes.js";
import classRoute from "./src/features/class/class.routes.js";
import departmentRoutes from "./src/features/deprtment/department.routes.js";
import adminRoutes from "./src/features/admin/admin.routes.js";
import cron from "node-cron";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
import apiDocs from "./swagger_ver3.0.json" with { type: "json" };
import { ApplicationError } from "./src/errorHandle/error.js";
import { connectToMongoDB, getDB } from "./src/config/mongodb.js";
import loggerMiddleware from "./src/middleware/logger.middleware.js";
import cleanLoggerMiddleware from "./src/middleware/cleanLogger.js";
import rateLimiterMiddleware from "./src/middleware/request.middleware.js";
import sectionFacultyMapRoute from "./src/features/sectionFacultyMap/sectionFacultyMap.routes.js";
import studentRoutes from "./src/features/student/student.routes.js";
import reportRoute from "./src/features/report/report.route.js";
// import { type } from "os";
const app = express();
app.use(bodyParser.json({ type: "application/*+json" }));
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(cookieParser());
const port = process.env.PORT || 3000;
var corsOptions = {
  // origin: "http://localhost:5173/*",
  allowedHeaders: "*",
  // credentials: true,
};
// const corsOptions = {
//   origin: "*", // No wildcard (*)
//   credentials: true, // Allow cookies & authorization headers
//   allowedHeaders: ["Content-Type", "Authorization"], // Avoid "*"
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Specify allowed methods
// };

app.use(cors(corsOptions));
app.use(express.json());
app.use(loggerMiddleware);
app.use(rateLimiterMiddleware);
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const geo = geoip.lookup(ip);
  // console.log(geo); 
  if (geo == null || geo.country === "IN") {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
  // Allow request if from India
});
app.use(helmet());
// app.use(waf({
//   strictMode: true, // Strong filtering
//   blockMaliciousRequests: true, // Rejects malicious requests
//   logBlockedRequests: true, // Logs attack attempts
// }));
app.use(cleanLoggerMiddleware);
app.use((err, req, res, next) => {
  console.log(err);
  if (err instanceof ApplicationError) {
    res.status(err.code).send(err.message);
  }
  res.send("Something went wrong,please try later");
});
app.use(express.static(path.join(__dirname, 'public/dist')));
app.use("/api/student/", studentRoutes);
app.use("/api/map/", sectionFacultyMapRoute);
app.use("/api/admin/", adminRoutes);
app.use("/api/user/", userRoute);
app.use("/api/timetable/", timetableRoutes);
app.use("/api/subject/", subjectRoute);
app.use("/api/attendance/", AttendanceRoute);
app.use("/api/class/", classRoute);
app.use("/api/department/", departmentRoutes);
app.use("/api-docs", swagger.serve, swagger.setup(apiDocs));
app.use("/api/report", reportRoute);
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/dist/", "index.html"));
});
// app.get('/apk', (req, res) => {
//   res.download(path.join(__dirname, './src/ApkFile/Attendance.apk'));
// });
app.use((req, res) => {
  res.status(404).send("API not found.");
});
async function generateSectionFacultyMap() {
  try {
    const db = getDB();
    const timetables = await db.collection("TimeTable").find({}).toArray();

    if (!timetables.length) {
      console.log("No timetable data found.");
      return;
    }

    const sectionMap = {};

    timetables.forEach(timetable => {
      for (const day in timetable.TimeTable) {
        timetable.TimeTable[day].forEach(entry => {
          // const sectionKey = `${entry.course}-${entry.session}-${entry.section}`; // Unique section identifier
          const sectionKey = `${entry.course}-${entry.session}-${entry.section}-${entry.branch}`;


          if (!sectionMap[sectionKey]) {
            sectionMap[sectionKey] = {
              batch: entry.session,
              department: entry.branch || "Unknown",
              section: entry.section,
              course: entry.course,
              map: []
            };
          }

          // Avoid duplicate subject entries
          const exists = sectionMap[sectionKey].map.some(
            sub => sub.subCode === entry.subject.subjectCode
          );

          if (!exists) {
            sectionMap[sectionKey].map.push({
              subCode: entry.subject.subjectCode,
              subjectName: entry.subject.subjectName,
              subjectId: entry.subject._id.toString(),
              ownerId: timetable.ownerId.toString()
            });
          }
        });
      }
    });

    // Convert object to array
    const result = Object.values(sectionMap);

    // Insert into sectionFacultyMap collection
    const collection = db.collection("SectionFacultyMap");
    await collection.deleteMany({}); // Optional: Clears existing data
    await collection.insertMany(result);

    console.log("Section-Faculty Mapping inserted successfully.");

  } catch (error) {
    console.error("Error:", error);
  }
}

cron.schedule("0 3 * * *", () => {
  console.log("Running generateSectionFacultyMap at 3:00 AM...");
  generateSectionFacultyMap();
});

app.listen(port, async () => {
  console.log(`Server is running at ${port}`);
  await connectToMongoDB();
  // generateSectionFacultyMap();
});
