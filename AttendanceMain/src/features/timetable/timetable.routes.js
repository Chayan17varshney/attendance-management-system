import express from "express";
const timetableRoutes = express.Router();
import TimeTableController from "./timetable.controller.js";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
import jwtAuthAdmin from "../../middleware/jwt.admin.middleware.js";
const timeTableController = new TimeTableController();

/////To fecth Prof Time Table
timetableRoutes.get("/timeTable", jwtAuthProf, (req, res) => {
  timeTableController.getTimeTable(req, res);
});
///////To Add Class in Time Table of Prof/////
timetableRoutes.post("/addClass", jwtAuthProf, (req, res) => {
  timeTableController.addClass(req, res);
});
// timetableRoutes.post("/reschedule", (req, res) => {});

timetableRoutes.post("/replacement",jwtAuthProf,(req, res) => {
  timeTableController.replacement(req, res);
});
timetableRoutes.get("/requestList", jwtAuthProf, (req, res) => {
  timeTableController.requestList(req, res);
});
timetableRoutes.post("/acceptRequest", jwtAuthProf, (req, res) => {
  timeTableController.acceptRequest(req, res);
});
timetableRoutes.post("/rejectRequest", jwtAuthProf, (req, res) => {
  timeTableController.rejectRequest(req, res);
});
// timetableRoutes.put("/updateClass", timeTableController.updateClass);
// timetableRoutes.delete("/deleteClass", timeTableController.deleteClass);

export default timetableRoutes;
