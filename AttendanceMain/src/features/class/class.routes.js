import express from "express";
import ClassController from "./class.controller.js";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
const classRoute = express.Router();
const classController = new ClassController();

classRoute.get("/getClassList", jwtAuthProf, (req, res) => {
  classController.getStudentList(req, res);
});

export default classRoute;
