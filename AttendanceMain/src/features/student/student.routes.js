import express from "express";
import StudentController from "./student.controller.js";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
const studentRoutes = express.Router();
const studentController = new StudentController();
////api/
studentRoutes.get("/findByScholar", jwtAuthProf, (req, res) => {
  studentController.findStudentByScholar(req, res);
});
studentRoutes.post("/addStudent", jwtAuthProf, (req, res) => {
  // studentController(req, res);
});
studentRoutes.get("/getStudentList", jwtAuthProf, (req, res) => {
  studentController.studentList(req, res);
});
// studentRoutes.post("/getElectiveList",jwtAuthProf,(req,res)=>{
//   // studentController.
// });
studentRoutes.post("/addElectiveList", jwtAuthProf, (req, res) => {
  studentController.addElectiveList(req, res);
});

export default studentRoutes;
