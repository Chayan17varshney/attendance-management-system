import jwt from "jsonwebtoken";
import crypto from "crypto";
const jwtAuthProf = (req, res, next) => {
  // console.log(req.headers);
  const token = req.headers["authorization"] || req.query.authorization;
  // console.log(encryptedToken);

  // console.log(token);

  if (!token) {
    res.status(401).send({ message: "Unauthorized or Session Expired!" });
  } else {
    try {
      // const token = crypto
      //   .privateDecrypt(
      //     process.env.PRIVATE_KEY,
      //     Buffer.from(encryptedToken, "hex")
      //   )
      //   .toString();
      const payload = jwt.verify(token, process.env.JWT_SECRET_TEACHER);
      // const data = JSON(payload);
      // console.log(data);

      // console.log(payload);
      if (payload != null) {
        req.userId = payload.userID;
        next();
      } else {
        return res
          .status(401)
          .send({ message: "Unauthorized or Session Expired!" });
      }
    } catch (err) {
      console.log(err);
      return res
        .status(401)
        .send({ message: "Unauthorized or Session Expired!" });
    }
  }
};
export default jwtAuthProf;
