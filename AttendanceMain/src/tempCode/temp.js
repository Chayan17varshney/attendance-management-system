import ExcelToJson from "../helper/excelToJson.js";
import AttendanceRepo from "../features/attendance/attendance.ropository.js";
import { ApplicationError } from "../errorHandle/error.js";
import xlsx from "xlsx";
import path from "path";
import StudentController from "../features/student/student.controller.js";
import SubjectRepo from "../features/subject/subject.repository.js";
import userRepository from "../features/user/user.repository.js";
import StudentRepo from "../features/student/student.repository.js";
const __dirname = path.resolve();
export default class AttendanceLoaderFromExcel {
  constructor() {
    this.AttendanceRepo = new AttendanceRepo();
    this.studentController = new StudentController();
    this.subjectRepo = new SubjectRepo();
    this.userRepo = new userRepository();
    this.studentRepo = new StudentRepo();
  }
  async loadAttendance() {
    const excelToJson = new ExcelToJson();
    const jsonList = excelToJson.convert();
    console.log(jsonList);
    const dateList =
      "08/01 09/01 10/01 15/01 16/01 17/01 23/01 24/01 29/01 30/01 31/01 05/02 06/02 07/02 12/02 13/02 14/02 15/02 19/02 20/02 21/02 26/02 27/02 28/02 11/03 12/3".split(
        " "
      );

    // console.log(dateList);
    for (var row of Object.keys(jsonList[0])) {
      if (row != "Scholar No." && row != "Name of Student") {
        let data = {
          date: row,
          attendance: [],
        };
        for (var item in jsonList) {
          // console.log(item + " " + row);
          // // console.log(jsonList[item]);
          // console.log(jsonList[item][row]);
          const newData = {
            "Scholar No.": jsonList[item]["Scholar No."].toString(),
            "Name of Student": jsonList[item]["Name of Student"],
            isPresent: jsonList[item][row].toString(),
          };
          data.attendance.push(newData);
        }
        // console.log(data);
        // const res = await this.AttendanceRepo.addAttendance(
        //   "65db40f0cd82a64f39baba87", //////subjectId
        //   "65d72672c7059e88b77a3535", //////ownerId,
        //   "01",
        //   "CSE",
        //   data
        // );
        // console.log(res);
      }
    }
  }
  // async facultyClassMapping() {
  //   try {
  //     const workbook = xlsx.readFile(
  //       __dirname + "/src/data/facultySectionMapping.xlsx"
  //     ); // Step 2
  //     let workbook_sheet = workbook.SheetNames; // Step 3
  //     let workbook_response;

  //     workbook_response = xlsx.utils.sheet_to_json(
  //       workbook.Sheets[workbook_sheet[0]]
  //     );
  //     console.log(workbook_response);
  //     workbook_response.forEach((key) => {
  //       console.log(key);
  //       Object.keys(key).forEach((e) => {
  //         console.log(e);
  //       });
  //     });
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
  customStringifyWithDoubleQuotes(obj) {
    let result = "{\n";
    for (const [key, value] of Object.entries(obj)) {
      result += `  "${key}": "${value}",\n`;
    }
    result = result.slice(0, -2) + "\n}"; // Remove last comma and newline, add closing bracket
    return result;
  }

  async loadStudent() {
    try {
      // console.log();
      // const { sec } = req.query;

      const workbook = xlsx.readFile(
        __dirname + "/src/data/studentList/M.TechIS2024-26.xlsx"
      ); // Step 2

      let workbook_sheet = workbook.SheetNames; // Step 3
      let workbook_response;

      console.log(workbook_sheet);
      workbook_response = await xlsx.utils.sheet_to_json(
        workbook.Sheets[workbook_sheet]
      );
      // const subjectCode = ["CSE221", "CSE321", "CSE322", "CSE323", "ME351"];

      // const facultyCode = [
      //   "640",
      //   "1145",
      //   "110001438191",
      //   "1067",
      //   "110030936841",
      // ];
      console.log(workbook_response);
      workbook_response.forEach(async (element) => {
        const data = {
          scholarNumber: element["Scholar No."].toString(),
          studentName: element["Name of Student"],

          branch: "Information Security",
          section: "01",
          batch: "2024-26",
        };
        // console.log(this.customStringifyWithDoubleQuotes(data), ",");
        let student = data;
        // for (let i = 0; i < subjectCode.length; i++) {
        //   const sub = await this.subjectRepo.getSubjectByCode(subjectCode[i]);
        //   const owner = await this.userRepo.findByEmployeeCode(facultyCode[i]);
        //   // console.log(owner._id.toString());
        //   student.subjects.push({
        //     subId: sub._id.toString(),
        //     ownerId: owner._id.toString(),
        //   });
        // }
        console.log(student);

        // const result = await this.studentRepo.addStudent(data);
        // console.log(result);
      });
    } catch (e) {
      console.log(e);

      // throw ApplicationError("something went wrong", 500);
    }
  }
}
