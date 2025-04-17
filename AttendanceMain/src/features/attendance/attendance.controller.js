import AttendanceRepo from "./attendance.ropository.js";
import AttendanceExcelMaker from "../../helper/attendanceExcelMaker.js";
import fs from "fs";
const att = new AttendanceExcelMaker();
import path from "path";
import StudentRepo from "../student/student.repository.js";
import sectionFacultyMapRepository from "../sectionFacultyMap/sectionFacultyMap.repository.js";
import TimeTableRepo from "../timetable/timetable.repository.js";
import UserRepository from "../user/user.repository.js";
const __dirname = path.resolve();
export default class AttendanceController {
  constructor() {
    (this.repo = new AttendanceRepo()),
      (this.studentRepo = new StudentRepo()),
      (this.secFacultyMap = new sectionFacultyMapRepository()),
      (this.userRepo = new UserRepository()),
      (this.timeTabeRepo = new TimeTableRepo());
  }
  async AttendaceSummaryOfScholarNo(req, res) {
    // console.log(req.body);
    try {
      const scholarNumber = req.body.scholarNumber;
      if (scholarNumber != null) {
        const student = await this.studentRepo.findByScholarNumber(
          scholarNumber
        );
        const faculty = await this.secFacultyMap.findSection({
          batch: student.batch,
          department: student.branch,
          section: student.section,
          // course: student.course,
        });

        const mp = faculty != null ? faculty.map : [];
        let summary = {
          studentName: student.StudentName,
          scholarNumber: scholarNumber,
          summary: [],
        };

        for (const e of mp) {
          // console.log(e);
          let filtr = {
            subjectId: e.subjectId,
            ownerId: e.ownerId,
            branch: student.branch,
            session: student.batch,
            section: student.section,
          };
          const facultyDetails = await this.userRepo.findByObjectId(e.ownerId);
          // console.log(facultyDetails);
          const check = await this.repo.findList(filtr);
          // console.log(filtr);
          if (check) {
            const attendance = await this.repo.analysisScholarNo(
              filtr,
              scholarNumber
            );
            // console.log(attendance);
            // console.log(e);
            const subName = e.subjectName;
            if (attendance) {
              summary.summary.push({
                subName,
                employee: facultyDetails.name,
                subCode: e.subCode,
                total: attendance.total ?? 0,
                present: attendance.present ?? 0,
              });
            }
            // console.log(summary);
          }
        }

        // console.log(summary);
        res.send(summary);
      } else {
        res.send("Invalid Data");
      }
      // console.log(faculty);
      // console.log(student);
    } catch (e) {
      console.log(e);
      res.send("Something went Wrong");
    }
  }

  async getAttendance(req, res) {
    try {
      const ownerId = req.userId;
      const { subjectId, section, branch } = req.body;
      const result = await this.repo.getAttendanceById(
        subjectId,
        ownerId,
        section,
        branch
      );
      res.status(200).send(result);
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async setAttendance(req, res) {
    try {
      // console.log(req.);
      const {
        subjectId,
        section,
        branch,
        data,
        count,
        dateTime,
        isTemp,
        remark,
      } = req.body;

      console.log(req.body);
      if (isTemp) {
        const ownerId = req.body.ownerId;
        let check = 0;
        // for (let i = 0; i < count; i++) {
        let result = await this.repo.addAttendance(
          count,
          dateTime,
          subjectId,
          ownerId,
          section,
          branch,
          data,
          remark
        );
        // console.log(req.body);
        const d = new Date(dateTime);
        const usrId = req.ownerId;
        result = await this.timeTabeRepo.findAndRemoveTimetable(
          req.userId,
          req.body.day,
          req.body.item
        );
        // console.log(req.userId);

        res.send(result);
      } else {
        const ownerId = req.userId;
        let check = 0;
        // for (let i = 0; i < count; i++) {
        const result = await this.repo.addAttendance(
          count,
          dateTime,
          subjectId,
          ownerId,
          section,
          branch,
          data,
          remark
        );
        // if (result == "success") check++;
        // }
        res.send({ message: result[1] });
        // if (count == check) {
        //   res.status(200).send({ message: "Success!" });
        // } else {
        //   res.status(401).send({ message: "Something Went Wrong!" });
        // }
      }
    } catch (e) {
      console.log(e);
      // throw new ApplicationError("something went wrong", 500);
    }
  }
  async addNewList(req, res) {
    try {
      const ownerId = req.userId;
      const { subjectId, course, branch, semester, section, session } =
        req.body;
      if (
        ownerId &&
        subjectId &&
        course &&
        branch &&
        semester &&
        section &&
        session
      ) {
        const data = {
          ownerId,
          subjectId,
          course,
          branch,
          semester,
          section,
          session,
        };
        const result = await this.repo.insertNewList(data);
        res.status(200).send({ message: result });
      } else {
        res.status(401).send({ message: "Unsuccessful" });
      }
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async findList(data) {
    try {
      return await this.repo.findList(data);
    } catch (e) {
      return null;
    }
  }

  async dashboardHelper(req, res) {
    try {
      const data = await this.repo.dashbordHelper(req.userId);
      // console.log(data);
      res.status(200).send({ data });
    } catch (e) {
      console.log(e);
      res.status(401).send({ message: "Something went Wrong" });
    }
  }

  async analysis(req, res) {
    try {
      const ownerId = req.userId;
      // console.log(req.body);
      const { session, section, subjectId, branch } = req.body;
      const data = { session, section, subjectId, branch };
      // console.log(await this.repo.analysis(data));
      res.status(200).send(await this.repo.analysis(data));
    } catch (e) {
      console.log(e);
      res.status(201).send({ message: "Internal Error" });
    }
  }
  async attendanceDownloader(req, res) {
    try {
      const ownerId = req.userId;
      // console.log(ownerId);
      const { session, section, subjectId, branch } = req.query;
      const request = {
        ownerId,
        subjectId,
        section,
        branch,
        session,
      };
      if (ownerId && subjectId && section && branch && session) {
        const fName = await att.makeAttendance(request);
        // console.log(fName);
        var filePath = __dirname + "/src/data/" + fName + ".xlsx";
        var fileName = fName + ".xlsx";
        // console.log("hello");
        await res.download(filePath, fileName, function (err) {
          if (err) {
            console.log(err); // Check error if you want
          }
          fs.unlink(filePath, function () {
            console.log("File was downloaded and deleted"); // Callback
          });

          // fs.unlinkSync(yourFilePath) // If you don't need callback
        });
      } else {
        res.send("Something Went Wrong!");
      }
    } catch (e) {
      console.log(e);
      res.status(401).send({ message: "Something Went Wrong" });
    }
  }
}
