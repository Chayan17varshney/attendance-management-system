import AdminRepository from "./admin.repository.js";
import AdminModel from "./admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userRepository from "../user/user.repository.js";
import { use } from "bcrypt/promises.js";
import { MongoClient, ObjectId } from "mongodb";
import TimeTableRepo from "../timetable/timetable.repository.js";
import { getDB, getSession } from "../../config/mongodb.js";
import xlsx from "xlsx";
import StudentRepo from "../student/student.repository.js";
import UserModel from "../user/user.model.js";
import SubjectRepo from "../subject/subject.repository.js";
import AttendanceController from "../attendance/attendance.controller.js";

export default class AdminController {
  constructor() {
    this.adminRepo = new AdminRepository();
    this.userRepo = new userRepository();
    this.timetableRepo = new TimeTableRepo();
    this.studentRepo = new StudentRepo();
    this.subjectRepo = new SubjectRepo();
    this.attendController = new AttendanceController();
  }
  async signUp(req, res) {
    console.log(req.body);

    const result = await this.adminRepo.findByEmployeeCode(
      req.body.employeeCode
    );
    if (result != null) {
      return res.status(404).send("Employee Already Exist ");
    } else {
      const { name, password, employeeCode, email, phone, role } = req.body;
      const hashedPassword = await bcrypt.hash(password, 12);
      const admin = new AdminModel(
        employeeCode,
        name,
        hashedPassword,
        email,
        phone,
        role
      );
      const user = await this.adminRepo.signUp(admin);
      // console.log(admin);
      const token = jwt.sign(
        {
          userID: admin._id,
          employeeCode: admin.employeeCode,
        },
        process.env.JWT_SECRET_ADMIN,
        {
          expiresIn: "10h",
        }
      );
      const newtoken = crypto
        .publicEncrypt(process.env.PUBLIC_KEY, Buffer.from(token))
        .toString("hex");

      res.status(201).send({
        name: user.name,
        employeeCode: user.employeeCode,
        authorization: newtoken,
      });
    }
  }

  async SignIn(req, res) {
    console.log(req.body);
    const empCode = req.body.employeeCode.trim();
    const result = await this.adminRepo.findByEmployeeCode(empCode);
    // console.log(result);
    // if (!result) {
    //   return res.status(404).send("Employee Already Exist ");
    // }
    // create token
    // else {
    // comparing password with the hashed password
    if (result != null) {
      const output = await bcrypt.compare(req.body.password, result.password);
      // console.log(output);
      if (output) {
        // console.log(result.role);
        const token = await jwt.sign(
          {
            userID: result._id,
            // employeeCode: result.employeeCode,
            role: result.role,
          },
          process.env.JWT_SECRET_ADMIN,
          {
            expiresIn: "10h",
          }
        );
        //send token
        // console.log(token);
        res.setHeader("authorization", token);
        res.cookie("token", token, { httpOnly: true, secure: true });

        return res.status(200).send({
          name: result.name,
          employeeCode: result.employeeCode,
          role: result.role,
          authorization: token,
        });
      } else {
        return res.status(401).send("Incorrect Credentials.");
      }
    } else {
      return res.status(401).send("Incorrect Credentials.");
    }
  }
  async addTimeTable(req, res) {
    try {
      const employeeCode = req.body.employeeCode;
      const user = await this.userRepo.findByEmployeeCode(employeeCode);

      if (user == null) {
        throw "User not found";
      } else if (req.role != "super" && user.department != req.role) {
        res.send({ message: "unauthorised!" });
      }
      const ownerId = user._id;
      const {
        subjectCode,
        branch,
        semester,
        timing,
        section,
        location,
        course,
        day,
        session,
      } = req.body;
      const result = await this.timetableRepo.addClass({
        day,
        ownerId,
        subjectCode,
        branch,
        semester,
        timing,
        section,
        location,
        course,
        session,
      });
      // console.log(result);
      if (result != null) {
        res.status(200).send({ message: "Successful" });
      } else {
        res.status(400).send("something went wrong");
      }
    } catch (e) {
      console.log(e);
      res.status(400).send("something went wrong");
    }
  }

  async removeTimetable(req, res) {
    try {
      const employeeCode = req.body.employeeCode;
      const user = await this.userRepo.findByEmployeeCode(employeeCode);
      if (user == null) {
        throw "User not found";
      } else if (req.role != "super" && user.department != req.role) {
        res.send({ message: "unauthorised!" });
      }
      const ownerId = user._id;
      const { item, day } = req.body;
      const result = await this.adminRepo.removeClass({
        day,
        item,
        ownerId,
      });
      // console.log(result);
      if (result != null) {
        res.status(200).send({ message: "Successful" });
      } else {
        res.status(400).send("something went wrong");
      }
    } catch (e) {
      console.log(e);
    }
  }
  async getTimetable(req, res) {
    try {
      const { day, employeeCode } = req.body;
      const user = await this.userRepo.findByEmployeeCode(employeeCode);
      if (user == null) {
        throw "User not found";
      } else if (req.role != "super" && user.department != req.role) {
        return res.send({ message: "unauthorised!" });
      }
      // console.log(user);
      const ownerId = user._id;
      const data = await this.timetableRepo.getTimeTableFromDay(day, ownerId);
      // console.log(data);
      res.status(200).send(data);
    } catch (e) {
      console.log(e);
      res.status(400).send("Seomthing went wrong");
    }
  }

  async modifyTimetable(req, res) {
    const trans = await getSession();
    try {
      await trans.withTransaction(async () => {
        const oldData = req.body.oldData;
        const newData = req.body.newData;
        //////removing Old Data/////
        let employeeCode = oldData.employeeCode;
        let user = await this.userRepo.findByEmployeeCode(employeeCode);
        if (user == null) {
          throw "User not found";
        } else if (req.role != "super" && user.department != req.role) {
          res.send({ message: "unauthorised!" });
        }
        let ownerId = user._id;
        // const { item, day } = oldData;
        let result = await this.adminRepo.removeClass({
          ...oldData,
          ownerId,
        });
        /////Adding New Data//////
        // console.log(result);
        employeeCode = newData.employeeCode;
        user = await this.userRepo.findByEmployeeCode(employeeCode);
        if (user == null) {
          throw "User not found";
        }
        ownerId = user._id;
        const {
          subjectCode,
          branch,
          semester,
          timing,
          section,
          location,
          course,
          day,
          session,
        } = newData;
        result = await this.timetableRepo.addClass({
          day,
          ownerId,
          subjectCode,
          branch,
          semester,
          timing,
          section,
          location,
          course,
          session,
        });
        // console.log(result);
      });
      await trans.commitTransaction();
      res.send({ message: "Class updated successfully" });
    } catch (e) {
      console.log(e);
      await trans.abortTransaction();
      // res.status(500).send({ message: "Something went wrong", error: e.message });
      res.status(200).send({ message: "something went wrong" });
    }
  }

  // async addStudentList(req, res) {
  //   try {
  //     if (!req.file) {
  //       return res.status(400).send("No file uploaded.");
  //     }

  //     const obj = JSON.parse(JSON.stringify(req.body));
  //     // console.log(obj);
  //     const fileBuffer = req.file.buffer;
  //     const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  //     // Assuming the data is in the first sheet
  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     // Convert the sheet data to JSON
  //     const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  //     // Format the data into an array of objects
  //     console.log(jsonData);
  //     const formattedData = jsonData.slice(1).map((row) => ({
  //       scholarNumber: row[0].toString(),
  //       studentName: row[1],
  //       branch: obj.Branch,
  //       section: row[2].toString(),
  //       batch: row[3],
  //     }));
  //     // console.log(formattedData);
  //     for (let i = 0; i < formattedData.length; i++) {
  //       const d = formattedData[i];
  //       if (
  //         d.scholarNumber &&
  //         d.studentName &&
  //         d.branch &&
  //         d.batch &&
  //         d.section &&
  //         d.section
  //       ) {
  //         const result = await this.studentRepo.addStudent(d);
  //         console.log(result);
  //       }
  //     }
  //     // Send the formatted data as the response
  //     res.send({ message: "Success" });
  //   } catch (e) {
  //     console.log(e);
  //     res.send({ message: "Check Format" });
  //   }
  //   // console.log(req);
  // }
  async addStudentList(req, res) {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const obj = JSON.parse(JSON.stringify(req.body));
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });

      // Assuming the data is in the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Convert the sheet data to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Format the data into an array of objects and filter out invalid rows
      const formattedData = jsonData
        .slice(1) // Skip the header row
        .filter((row) =>
          row.every(
            (cell) => cell !== undefined && cell !== null && cell !== ""
          )
        ) // Remove rows with empty cells
        .map((row) => ({
          scholarNumber: row[0]?.toString() ?? "", // Convert to string
          studentName: row[1]?.toString() ?? "", // Ensure it's a string
          branch: obj.Branch ?? "", // Assuming `obj.Branch` is available
          section: row[2]?.toString() ?? "", // Convert to string
          batch: row[3]?.toString() ?? "", // Convert to string
        }))
        .filter(
          (d) =>
            d.scholarNumber && d.studentName && d.branch && d.section && d.batch
        ); // Filter out rows with invalid values

      console.log(formattedData);

      // Add each student to the database
      for (const student of formattedData) {
        const result = await this.studentRepo.addStudent(student);
        console.log(result);
      }

      res.send({ message: "Success" });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Check Format" });
    }
  }

  // async addTimeTableList(req, res) {
  //   // console.log(req);

  //   try {
  //     // console.log(req.body);
  //     const employeeCode = req.body.employeeCode;
  //     const user = await this.userRepo.findByEmployeeCode(employeeCode);
  //     console.log(user);
  //     if (!req.file) {
  //       console.log("No file attached");
  //       return res.status(400).send("No file uploaded.");
  //     }
  //     // if (user == null) {
  //     //   throw "User not found";
  //     // } else if (req.role != "super" && user.department != req.role) {
  //     //   return res.send({ message: "unauthorised!" });
  //     // }
  //     const ownerId = user._id;
  //     const obj = JSON.parse(JSON.stringify(req.body));
  //     // console.log(obj);
  //     const fileBuffer = req.file.buffer;
  //     const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  //     // Assuming the data is in the first sheet
  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     // Convert the sheet data to JSON
  //     const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  //     // Format the data into an array of objects
  //     const filteredData = jsonData.filter((row) =>
  //       row.some((cell) => cell != null && cell.toString().trim() !== "")
  //     );
  //     // console.log(filteredData);
  //     const formattedData = filteredData.slice(1).map((row) => ({
  //       ///////
  //       subjectCode: row[0],
  //       branch: row[1].toUpperCase(),
  //       semester: row[2].toUpperCase(),
  //       timing: row[3],
  //       section: row[4].toString(),
  //       location: row[5],
  //       course: row[6],
  //       day: row[7],
  //       session: row[8],
  //     }));
  //     // console.log(formattedData);
  //     let rslt = {};
  //     for (let i = 0; i < formattedData.length; i++) {
  //       let d = formattedData[i];
  //       d["ownerId"] = ownerId;
  //       const result = await this.timetableRepo.addClass(d);
  //       console.log(result);
  //       rslt[i] = result;
  //     }

  //     res.status(200).send({ message: "Successful" });
  //   } catch (e) {
  //     console.log(e);
  //     res.send({ message: "Check Format" });
  //   }
  // }
  async addTimeTableList(req, res) {
    try {
      const employeeCode = req.body.employeeCode;
      const user = await this.userRepo.findByEmployeeCode(employeeCode);

      if (!req.file) {
        console.log("No file attached");
        return res.status(400).send("No file uploaded.");
      }

      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }

      // Uncomment and adjust if role-based authorization is required
      // if (req.role !== "super" && user.department !== req.role) {
      //   return res.status(403).send({ message: "Unauthorized!" });
      // }

      const ownerId = user._id;
      const obj = JSON.parse(JSON.stringify(req.body));
      const fileBuffer = req.file.buffer;

      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Filter and format the data
      const filteredData = jsonData.filter((row) =>
        row.some((cell) => cell != null && cell.toString().trim() !== "")
      );

      const formattedData = filteredData
        .slice(1)
        .map((row, index) => {
          try {
            return {
              subjectCode: row[0]?.toString().trim() || "",
              branch: row[1]?.toString().trim().toUpperCase() || "",
              semester: row[2]?.toString().trim().toUpperCase() || "",
              timing: row[3]?.toString().trim() || "",
              section: row[4]?.toString().trim() || "",
              location: row[5]?.toString().trim() || "",
              course: row[6]?.toString().trim() || "",
              day: row[7]?.toString().trim() || "",
              session: row[8]?.toString().trim() || "",
            };
          } catch (err) {
            console.error(`Error formatting row ${index + 2}:`, err); // Adjust for 1-based Excel index
            return null;
          }
        })
        .filter((d) => d && Object.values(d).every((value) => value)); // Filter out invalid rows
      // console.log(formattedData);
      // Add each timetable entry to the database
      const results = {};
      for (const [index, entry] of formattedData.entries()) {
        try {
          entry["ownerId"] = ownerId;
          const result = await this.timetableRepo.addClass(entry);
          results[index] = result;
        } catch (err) {
          console.error(`Error adding entry ${index + 1}:`, err);
          results[index] = { error: "Failed to add entry" };
        }
      }

      res.status(200).send({ message: "Success" });
    } catch (error) {
      console.error("Error processing timetable list:", error);
      res.status(500).send({ message: "Check Format" });
    }
  }

  // async addFacultyList(req, res) {
  //   try {
  //     if (!req.file) {
  //       return res.status(400).send("No file uploaded.");
  //     }
  //     // if (user == null) {
  //     //   throw "User not found";
  //     // } else if (req.role != "super" && user.department != req.role) {
  //     //   return res.send({ message: "unauthorised!" });
  //     // }
  //     // const ownerId = user._id;
  //     const obj = JSON.parse(JSON.stringify(req.body));
  //     console.log(obj);
  //     const fileBuffer = req.file.buffer;
  //     const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  //     // Assuming the data is in the first sheet
  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     // Convert the sheet data to JSON
  //     const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  //     // Format the data into an array of objects
  //     const filteredData = jsonData.filter((row) =>
  //       row.some((cell) => cell != null && cell.toString().trim() !== "")
  //     );
  //     // console.log(filteredData);
  //     const formattedData = filteredData.slice(1).map((row) => ({
  //       name: row[0],
  //       employeeCode: row[1].toString(),
  //       password: row[2].toString(),
  //       about: row[3],
  //       role: row[4],
  //       department: obj.Branch,
  //       email: row[6],
  //       phone: row[7].toString(),
  //       abbv: row[8],
  //     }));
  //     // console.log(formattedData);

  //     for (let i = 0; i < formattedData.length; i++) {
  //       const result = await this.userRepo.findByEmployeeCode(
  //         formattedData[i].employeeCode
  //       );
  //       if (result != null) {
  //         console.log("Employee Already Exist ");
  //       } else {
  //         let data = formattedData[i];
  //         const hashedPassword = await bcrypt.hash(data.password, 12);
  //         data.password = hashedPassword;

  //         const user = new UserModel(
  //           data.name,
  //           data.password,
  //           data.about,
  //           data.employeeCode,
  //           data.role,
  //           data.department,
  //           data.email,
  //           data.phone,
  //           data.abbv
  //         );
  //         const newusr = await this.userRepo.signUp(user);
  //         if (user != null) {
  //           await this.timetableRepo.addNewList(newusr._id);
  //         }
  //       }
  //     }

  //     res.status(200).send({ message: "Successful" });
  //   } catch (e) {
  //     console.log(e);
  //     res.send({ message: "Check Format" });
  //   }
  // }

  async addFacultyList(req, res) {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "No file uploaded." });
      }

      const obj = JSON.parse(JSON.stringify(req.body));
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Filter and format the data
      const filteredData = jsonData.filter((row) =>
        row.some((cell) => cell != null && cell.toString().trim() !== "")
      );

      const formattedData = filteredData
        .slice(1)
        .map((row, index) => {
          try {
            return {
              name: row[0]?.toString().trim(),
              employeeCode: row[1]?.toString().trim(),
              password: row[2]?.toString().trim(),
              about: row[3]?.toString().trim(),
              role: row[4]?.toString().trim(),
              department: obj.Branch?.toString().trim(),
              email: row[6]?.toString().trim(),
              phone: row[7]?.toString().trim(),
              abbv: row[8]?.toString().trim(),
            };
          } catch (err) {
            console.error(`Error formatting row ${index + 2}:`, err); // Adjust for 1-based index
            return null;
          }
        })
        .filter((d) => d && Object.values(d).every((value) => value)); // Remove invalid rows

      for (const faculty of formattedData) {
        try {
          const existingUser = await this.userRepo.findByEmployeeCode(
            faculty.employeeCode
          );
          console.log(existingUser);

          if (existingUser) {
            console.log(
              `Employee with code ${faculty.employeeCode} already exists.`
            );
            continue;
          }
          // else {
          // Hash the password
          faculty.password = await bcrypt.hash(faculty.password, 12);

          // Create and save the user
          const user = new UserModel(
            faculty.name,
            faculty.password,
            faculty.about,
            faculty.employeeCode,
            faculty.role,
            faculty.department,
            faculty.email,
            faculty.phone,
            faculty.abbv
          );

          const newUser = await this.userRepo.signUp(user);

          // Add associated timetable list
          if (newUser) {
            await this.timetableRepo.addNewList(newUser._id);
          }
          // }
        } catch (err) {
          console.error(
            `Error processing employee ${faculty.employeeCode}:`,
            err
          );
        }
      }

      res.status(200).send({ message: "Faculty list processed successfully." });
    } catch (error) {
      console.error("Error adding faculty list:", error);
      res
        .status(500)
        .send({ message: "An error occurred. Please check the file format." });
    }
  }

  async AttendaceSummaryOfScholarNo(req, res) {
    try {
      return await this.attendController.AttendaceSummaryOfScholarNo(req, res);
    } catch (error) {
      console.error("Error getting attendance summary:", error);
      res.status(500).send({ message: "An error occurred. Please try again." });
    }
  }

  // async addSubjectList(req, res) {
  //   try {
  //     if (!req.file) {
  //       return res.status(400).send("No file uploaded.");
  //     }
  //     // if (user == null) {
  //     //   throw "User not found";
  //     // } else if (req.role != "super" && user.department != req.role) {
  //     //   return res.send({ message: "unauthorised!" });
  //     // }
  //     // const ownerId = user._id;
  //     const obj = JSON.parse(JSON.stringify(req.body));
  //     console.log(obj);
  //     const fileBuffer = req.file.buffer;
  //     const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  //     // Assuming the data is in the first sheet
  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     // Convert the sheet data to JSON
  //     const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  //     // Format the data into an array of objects
  //     const filteredData = jsonData.filter((row) =>
  //       row.some((cell) => cell != null && cell.toString().trim() !== "")
  //     );
  //     // console.log(filteredData);
  //     const formattedData = filteredData.slice(1).map((row) => ({
  //       subjectName: row[0],
  //       subjectCode: row[1].toUpperCase(),
  //       department: row[2].toUpperCase(),
  //       isElective: row[3].toString().toLowerCase(),
  //     }));
  //     for (let i = 0; i < formattedData.length; i++) {
  //       const dat = formattedData[i];

  //       const result = await this.subjectRepo.getSubjectByCode(dat.subjectCode);
  //       if (result == null) {
  //         const result2 = await this.subjectRepo.addSubject(dat);
  //         // console.log(result2);
  //       } else {
  //         console.log("Already exist");
  //       }
  //     }
  //     res.send({ message: "Success" });
  //   } catch (e) {
  //     console.log(e);
  //     res.send({ message: "Check Format" });
  //   }
  // }
  async addSubjectList(req, res) {
    try {
      if (!req.file) {
        return res.status(400).send({ message: "No file uploaded." });
      }

      const obj = JSON.parse(JSON.stringify(req.body));
      console.log(obj);

      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // Filter and format the data
      const filteredData = jsonData.filter((row) =>
        row.some((cell) => cell != null && cell.toString().trim() !== "")
      );
      // console.log(filteredData);
      const formattedData = filteredData
        .slice(1) // Skip header row
        .map((row, index) => {
          try {
            // Extract and format each row
            return {
              subjectName: row[0]?.toString().trim(), // Clean up subject name
              subjectCode: row[1]?.toUpperCase().trim(), // Convert to upper case
              department: row[2]?.toUpperCase().trim(), // Convert to upper case
              isElective: row[3] === true, // Ensure isElective is boolean
            };
          } catch (err) {
            console.error(`Error formatting row ${index + 2}:`, err); // Log the error if formatting fails
            return null; // Return null to exclude invalid rows
          }
        })
        .filter(
          (d) =>
            d &&
            Object.values(d).every(
              (value) => value !== null && value !== undefined && value !== ""
            )
        ); // Remove rows with null or empty values

      // const formattedData = filteredData
      //   .slice(1)
      //   .map((row, index) => {
      //     try {
      //       return {
      //         subjectName: row[0]?.toString().trim(),
      //         subjectCode: row[1]?.toUpperCase().trim(),
      //         department: row[2]?.toUpperCase().trim(),
      //         isElective: row[3]?.toString().toLowerCase().trim() === "true", // Convert to boolean
      //       };
      //     } catch (err) {
      //       console.error(`Error formatting row ${index + 2}:`, err); // Adjust for 1-based index
      //       return null;
      //     }
      //   })
      //   .filter((d) => d && Object.values(d).every((value) => value)); // Remove invalid rows
      console.log(formattedData);
      for (const subject of formattedData) {
        try {
          const existingSubject = await this.subjectRepo.getSubjectByCode(
            subject.subjectCode
          );

          if (existingSubject) {
            console.log(
              `Subject with code ${subject.subjectCode} already exists.`
            );
            continue;
          }

          const addedSubject = await this.subjectRepo.addSubject(subject);
          console.log(`Added subject: ${subject.subjectCode}`, addedSubject);
        } catch (err) {
          console.error(`Error adding subject ${subject.subjectCode}:`, err);
        }
      }

      res.status(200).send({ message: "Subjects processed successfully." });
    } catch (error) {
      console.error("Error processing subject list:", error);
      res
        .status(500)
        .send({ message: "An error occurred. Please check the file format." });
    }
  }

  async addElectiveList(req, res) {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded.");
      }

      const obj = JSON.parse(JSON.stringify(req.body));
      // console.log(obj);
      const fileBuffer = req.file.buffer;
      const workbook = xlsx.read(fileBuffer, { type: "buffer" });
      let ownerId = new ObjectId();
      let subId = new ObjectId();
      if (obj.employeeCode != null && obj.subjectCode != null) {
        const usr = await this.userRepo.findByEmployeeCode(obj.employeeCode);
        const sub = await this.subjectRepo.getSubjectByCode(obj.subjectCode);
        // console.log(sub);
        if (usr && sub) {
          ownerId = usr._id;
          subId = sub._id.toString();
        } else {
          return res.status(400).send("employeeCode or subjectCode is wrong!");
        }
      }
      // Assuming the data is in the first sheet
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Convert the sheet data to JSON
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      // console.log(jsonData);
      // Format the data into an array of objects and filter out invalid rows
      const formattedData = jsonData
        .slice(1) // Skip the header row
        .filter((row) =>
          row.every(
            (cell) => cell !== undefined && cell !== null && cell !== ""
          )
        ) // Remove rows with empty cells
        .map((row) => ({
          scholarNumber: row[0]?.toString() ?? "", // Convert to string
          StudentName: row[1]?.toString() ?? "", // Ensure it's a string
          branch: obj.branch ?? "", // Assuming `obj.Branch` is available
          section: row[2]?.toString() ?? "", // Convert to string
          batch: row[3]?.toString() ?? "", // Convert to string
        }))
        .filter(
          (d) =>
            d.scholarNumber && d.StudentName && d.branch && d.section && d.batch
        ); // Filter out rows with invalid values

      // console.log(formattedData);
      const finalData = {
        ownerId,
        subjectId: subId,
        branch: obj.branch,
        section: obj.section,
        batch: obj.batch,
        list: formattedData,
      };
      // console.log(finalData);
      await this.studentRepo.addElectiveList(finalData);
      return res.send({ message: "Success" });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Check Format" });
    }
  }

  async filterSearch(req, res) {
    try {
      const Name = req.query.n || "";
      const employeeCode = req.query.ec || "";
      const su = req.query.su;
      if (su == null) {
        if (Name.length < 3 && employeeCode.length < 3) {
          return res
            .status(400)
            .json({ error: "Query must be at least 3 characters long." });
        }

        // Case-insensitive search for partial matches in the `name` field
        if (Name.length >= 3) {
          const db = await getDB();
          const userCollection = db.collection("User");
          const user = await userCollection
            .find(
              {
                name: { $regex: Name, $options: "i" }, // Case-insensitive search
              },
              {
                projection: { name: 1, employeeCode: 1, department: 1, _id: 0 }, // Include name and employeeCode, exclude _id
              }
            )
            .toArray();
          // console.log(user);
          res.json(user); // Send the list of matched users
        } else if (employeeCode.length >= 3) {
          const db = await getDB();
          const userCollection = db.collection("User");
          const user = await userCollection
            .find(
              {
                employeeCode: { $regex: employeeCode, $options: "i" }, // Case-insensitive search
              },
              {
                projection: { name: 1, employeeCode: 1, department: 1, _id: 1 }, // Include name and employeeCode, exclude _id
              }
            )
            .toArray();
          // console.log(user);
          res.json(user); // Send the list of matched users
        } else {
          return res
            .status(400)
            .json({ error: "Query must be at least 3 characters long." });
        }
      } else {
        // console.log(su);
        const db = await getDB();
        const subjectCollection = await db.collection("Subject");
        const sub = await subjectCollection
          .find(
            {
              subjectCode: { $regex: su, $options: "i" }, // Case-insensitive search
            },
            {
              projection: {
                subjectName: 1,
                subjectCode: 1,
                department: 1,
                _id: 1,
              }, // Include name and employeeCode, exclude _id
            }
          )
          .toArray();
        // console.log(sub);
        res.json(sub);
      }
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ error: "Internal server error", details: err.message });
    }
  }
  async branchFilter(req, res) {
    try {
      const branch = ["CSE", "ECE", "EE", "ME", "MDS", "MME", "CIVIL", "CHEM"];
      res.json(branch);
    } catch (e) {
      console.log(e);
    }
  }
}
