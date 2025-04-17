import express from "express";
import AdminController from "./admin.controller.js";
import jwtAuthAdmin from "../../middleware/jwt.admin.middleware.js";
const controller = new AdminController();
const adminRoutes = express.Router();
import multer from "multer";

const storage = multer.memoryStorage();

// Initialize multer with memory storage
const upload = multer({ storage: storage });

// adminRoutes.post("/signUp", (req, res) => {
//   controller.signUp(req, res);
// });
adminRoutes.post("/signIn", (req, res) => {
  // console.log(req.body);
  controller.SignIn(req, res);
});
adminRoutes.post("/addTimeTable", jwtAuthAdmin, (req, res) => {
  controller.addTimeTable(req, res);
  if (req.role == "super") {
    controller.addTimeTable(req, res);
  } else if (req.role == req.body.branch) {
    controller.addTimeTable(req, res);
  } else {
    res.send({ message: "Not Authorised" });
  }
});
adminRoutes.post("/removeTimeTable", jwtAuthAdmin, async (req, res) => {
  if (req.role == "super") {
    controller.removeTimetable(req, res);
  } else if (req.role == req.body.item.branch) {
    controller.removeTimetable(req, res);
  } else {
    res.send({ message: "Not Authorised" });
  }
  // res.send();
});
adminRoutes.post("/getTimetable", jwtAuthAdmin, async (req, res) => {
  // console.log("hello");
  controller.getTimetable(req, res);
});
adminRoutes.post("/modifyTimetable", jwtAuthAdmin, async (req, res) => {
  if (req.role == "super") {
    controller.modifyTimetable(req, res);
  } else if (
    req.role == req.body.oldData.item.branch &&
    req.role == req.body.newData.item.branch
  ) {
    controller.getTimetable(req, res);
  } else {
    res.send({ message: "Not Authorised" });
  }
});
adminRoutes.post(
  "/uploadStudentList",
  jwtAuthAdmin,
  upload.single("file"),
  async (req, res) => {
    controller.addStudentList(req, res);
  }
);
adminRoutes.post(
  "/uploadTimetable",
  jwtAuthAdmin,
  upload.single("file"),
  async (req, res) => {
    controller.addTimeTableList(req, res);
    // setTimeout((e) => {
    //   res.send({ message: "Success!" });
    // }, 5000);
  }
);
adminRoutes.post(
  "/uploadFacultyList",
  jwtAuthAdmin,
  upload.single("file"),
  async (req, res) => {
    controller.addFacultyList(req, res);
  }
);
adminRoutes.post(
  "/uploadSubjectList",
  jwtAuthAdmin,
  upload.single("file"),
  async (req, res) => {
    controller.addSubjectList(req, res);
  }
);
adminRoutes.post(
  "/addElectiveList",
  jwtAuthAdmin,
  upload.single("file"),
  (req, res) => {
    controller.addElectiveList(req, res);
  }
);

adminRoutes.get("/searchFaculty", async (req, res) => {
  // console.log(req.query);
  controller.filterSearch(req, res);
});
adminRoutes.get("/courseFilter", (req, res) => {
  controller.branchFilter(req, res);
});

adminRoutes.post("/attendanceByScholarId", jwtAuthAdmin, (req, res) => {
  // console.log(req.body);
  controller.AttendaceSummaryOfScholarNo(req, res);
});
adminRoutes.all("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true, // Ensure this matches how the cookie was set
    sameSite: "Lax",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

export default adminRoutes;
