import express from "express";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
import jwtAuthAdmin from "../../middleware/jwt.admin.middleware.js";
import AttendanceController from "./attendance.controller.js";
import path from "path";

const __dirname = path.resolve();
const AttendanceRoute = express.Router();
const attendaceController = new AttendanceController();

AttendanceRoute.post("/getAttendance", jwtAuthProf, (req, res) => {
  attendaceController.getAttendance(req, res);
});
AttendanceRoute.post("/setAttendance", jwtAuthProf, (req, res) => {
  // console.log("Hii");
  attendaceController.setAttendance(req, res);
});
AttendanceRoute.post("/addNewList", jwtAuthAdmin, (req, res) => {
  attendaceController.addNewList(req, res);
});
AttendanceRoute.post("/analysis", jwtAuthProf, (req, res) => {
  attendaceController.analysis(req, res);
});
AttendanceRoute.get("/dashboardHelper", jwtAuthProf, (req, res) => {
  attendaceController.dashboardHelper(req, res);
});
AttendanceRoute.get("/downloadAttendance", jwtAuthProf, async (req, res) => {
  try {
    attendaceController.attendanceDownloader(req, res);
  } catch (e) {
    console.log(e);
  }
});
AttendanceRoute.post(
  "/attendanceByScholarId",
  jwtAuthProf,
  (req, res) => {
    attendaceController.AttendaceSummaryOfScholarNo(req, res);
  }
);

export default AttendanceRoute;
