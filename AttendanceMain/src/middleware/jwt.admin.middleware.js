import crypto from "crypto";
import jwt from "jsonwebtoken";
const jwtAuthAdmin = (req, res, next) => {
  // console.log(req.headers);
  const token = req.headers["authorization"] || req.cookies["token"];
  // if (!token) {
  //   res.status(401).send("Unauthorized access");
  // } else {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_ADMIN);
    // const data = JSON(payload);
    // console.log(data);

    // console.log(payload);
    if (payload != null) {
      req.userId = payload.userID;
      req.role = payload.role;
      next();
    } else {
      return res.status(401).send("Unauthorized");
    }
  } catch (err) {
    console.log(err);
    return res.status(401).send("Unauthorized");
  }
  // }
};
export default jwtAuthAdmin;
