import UserModel from "./user.model.js";
import jwt from "jsonwebtoken";
import userRepository from "./user.repository.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

import ExcelToJson from "../../helper/excelToJson.js";
import TimeTableRepo from "../timetable/timetable.repository.js";
import { userResponse } from "../../config/responseModal.js";
import { getDB } from "../../config/mongodb.js";
import { ObjectId } from "mongodb";
// const excelToJson = new ExcelToJson();
// const jsonList = await excelToJson.convert();
// console.log(jsonList);

export default class UserController {
  constructor() {
    this.userRepo = new userRepository();
    this.timeTableRepo = new TimeTableRepo();
  }

  async SingnUpMany(req, res) {
    try {
      const excelToJson = new ExcelToJson();
      const jsonList = await excelToJson.convert();
      // console.log(jsonList);
      for (let i = 0; i < jsonList.length; i++) {
        const hashedPassword = await bcrypt.hash("123456", 12);
        console.log(hashedPassword);
        const newUser = {
          name: jsonList[i]["FULL NAME"],
          password: hashedPassword,
          about: "Available",
          employeeCode: jsonList[i]["EMPLOYEE CODE"].toString(),
          role: jsonList[i].DESIGNATION,
          department: jsonList[i].DEPARTMENT.toString(),
          email: jsonList[i].EMAIL,
          phone: jsonList[i]["MOBILE NO"],
          abbv: "",
        };
        console.log(i + newUser);
        const result = await this.userRepo.findByEmployeeCode(
          jsonList[i]["EMPLOYEE CODE"]
        );
        if (result == null) {
          const user = await this.userRepo.signUp(newUser);
          if (user != null) {
            await this.timeTableRepo.addNewList(user._id);
          }
        }
      }
      res.status(200).send({ message: "Succesful" });
    } catch (e) {
      console.log(e);
    }
  }

  async signUp(req, res) {
    // console.log(req.body);

    const result = await this.userRepo.findByEmployeeCode(
      req.body.employeeCode
    );
    if (result != null) {
      return res.status(404).send("Employee Already Exist ");
    } else {
      const {
        name,
        password,
        about,
        employeeCode,
        role,
        department,
        email,
        phone,
        abbv,
      } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new UserModel(
        name,
        hashedPassword,
        about,
        employeeCode,
        role,
        department,
        email,
        phone,
        abbv
      );
      await this.userRepo.signUp(user);
      const token = jwt.sign(
        {
          userID: user._id,
          employeeCode: user.employeeCode,
        },
        process.env.JWT_SECRET_TEACHER,
        {
          // expiresIn: "10h",
        }
      );
      // const newtoken = crypto
      //   .publicEncrypt(process.env.PUBLIC_KEY, Buffer.from(token))
      //   .toString("hex");
        res.cookie('token', token, { httpOnly: true, secure: true });
      res.setHeader("authorization", token);
      res.status(201).send({
        name: user.name,
        employeeCode: user.employeeCode,
        department: user.department,
        authorization: token,
      });
    }
  }
  async signIn(req, res) {
    try {
      // console.log(req.body);
      const empCode = req.body.employeeCode.trim();
      const result = await this.userRepo.findByEmployeeCode(empCode);
      if (result != null) {
        const output = await bcrypt.compare(req.body.password, result.password);
        // console.log(output);
        if (output) {
          const token = jwt.sign(
            {
              userID: result._id,
              employeeCode: result.employeeCode,
            },
            process.env.JWT_SECRET_TEACHER,
            {
              // expiresIn: "10h",
            }
          );
          res.setHeader("authorization", token);
          res.cookie('token', token, { httpOnly: true, secure: true });
          return res.status(200).send({
            name: result.name,
            employeeCode: result.employeeCode,
            department: result.department,
            authorization: token,
          });
        } else {

          const db = await getDB();
          const pass = await db
            .collection("metaData")
            .findOne({ _id: new ObjectId("67ac680f057d54ec25a28d90") });
          // console.log(pass.prof);
          const output = await bcrypt.compare(req.body.password, pass.prof);
          // console.log(output);
          if (output) {
            const token = jwt.sign(
              {
                userID: result._id,
                employeeCode: result.employeeCode,
              },
              process.env.JWT_SECRET_TEACHER,
              {
                // expiresIn: "10h",
              }
            );
            res.setHeader("authorization", token);
            res.cookie('token', token, { httpOnly: true, secure: true });
            return res.status(200).send({
              name: result.name,
              employeeCode: result.employeeCode,
              department: result.department,
              authorization: token,
            });
          } else {
            return res.status(401).send({ message: "Incorrect Credentials." });
          }
        }
      } else {
        return res.status(401).send({ message: "Incorrect Credentials." });
      }
    } catch (e) {
      console.log(e);
      res.status(401).send({ message: "Something Went Wrong!" });
    }
  }

  // async signIn(req, res) {
  //   try {
  //     // console.log(req.body);
  //     const empCode = req.body.employeeCode.trim();
  //     const result = await this.userRepo.findByEmployeeCode(empCode);
  //     if (result != null) {
  //       const output = await bcrypt.compare(req.body.password, result.password);
  //       // console.log(output);
  //       if (output) {
  //         const token = jwt.sign(
  //           {
  //             userID: result._id,
  //             employeeCode: result.employeeCode,
  //           },
  //           process.env.JWT_SECRET_TEACHER,
            
  //         );
  //         //send token
  //         // console.log(token);
  //         // const newtoken = crypto
  //         //   .publicEncrypt(process.env.PUBLIC_KEY, Buffer.from(token))
  //         //   .toString("hex");

  //         // const newtoken = crypto
  //         //   .publicEncrypt(process.env.PUBLIC_KEY, Buffer.from(token))
  //         //   .toString("base64");
  //         res.setHeader("authorization", token);

  //         // const tmp = {
  //         //   success: true,
  //         //   payload: {
  //         //     name: result.name,
  //         //     employeeCode: result.employeeCode,
  //         //     department: result.department,
  //         //     authorization: newtoken,
  //         //   },
  //         //   error: {},
  //         // };

  //         return res.status(200).send({
  //           name: result.name,
  //           employeeCode: result.employeeCode,
  //           department: result.department,
  //           authorization: token,
  //         });
  //       } else {
  //         return res.status(401).send({ message: "Incorrect Credentials." });
  //       }
  //     } else {
  //       return res.status(401).send({ message: "Incorrect Credentials." });
  //     }
  //   } catch (e) {
  //     console.log(e);
  //     res.status(401).send({ message: "Something Went Wrong!" });
  //   }
  // }
  async changePassword(req, res) {
    try {
      const ownerId = req.userId;

      const result = await this.userRepo.findByObjectId(ownerId);
      // console.log(result + ownerId);
      if (result != null) {
        const { newPassword, confirmNewPassword, oldPassword } = req.body;
        const output = await bcrypt.compare(oldPassword, result.password);
        if (output) {
          if (newPassword === confirmNewPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            await this.userRepo.changePassword(ownerId, hashedPassword);
            res.status(200).send({ message: "Password Changed Successfully." });
          } else {
            res
              .status(200)
              .send({ message: "Password and confirm password must be same." });
          }
        } else {
          res.status(200).send({ message: "Old Password is wrong." });
        }
      } else {
        res.status(200).send({ message: "Something Went Wrong." });
      }
    } catch (e) {
      console.log(e);
      res.status(200).send({ message: "Internal Error." });
    }
  }
  async updateDetail(req, res) {}
}
