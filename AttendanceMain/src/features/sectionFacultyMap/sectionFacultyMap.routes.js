import express from "express";
import SectionFacultyMapController from "./sectionFacultyMap.controller.js";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
const sectionFacultyMapRoute = express.Router();
const sectionFacultyMapController = new SectionFacultyMapController();
sectionFacultyMapRoute.post("/addMap", jwtAuthProf, (req, res) => {
  sectionFacultyMapController.addSectionFacultyMap(req, res);
});

export default sectionFacultyMapRoute;
