import express from "express";
import SubjectController from "./subject.controller.js";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
import jwtAuthAdmin from "../../middleware/jwt.admin.middleware.js";
const SubjectRoute = express.Router();
const subjectController = new SubjectController();

SubjectRoute.get("/getSubject", jwtAuthProf, (req, res) => {
  subjectController.getSubject(req, res);
});
SubjectRoute.post("/addSubject", jwtAuthAdmin, (req, res) => {
  subjectController.addSubject(req, res);
});

export default SubjectRoute;
