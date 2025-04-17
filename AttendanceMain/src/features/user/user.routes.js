import express from "express";
import UserController from "./user.controller.js";
import jwtAuthAdmin from "../../middleware/jwt.admin.middleware.js";
import jwtAuthProf from "../../middleware/jwt.middleware.js";
const userController = new UserController();
const userRoute = express.Router();

// userRoute.post("/signUp", jwtAuthAdmin, (req, res) => {
//   // console.log("hello");
//   userController.signUp(req, res);
// });
userRoute.post("/signIn", (req, res) => {
  // console.log(req.body);
  userController.signIn(req, res);
});
userRoute.get("/signUpMany", jwtAuthAdmin, async (req, res) => {
  await userController.SingnUpMany(req, res);
});
userRoute.put("/changePassword", jwtAuthProf, async (req, res) => {
  await userController.changePassword(req, res);
});
// userRoute.post("/sectionFacultyMap", jwtAuthProf, (req, res) => {});
export default userRoute;
