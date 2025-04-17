import { getDB } from "../../config/mongodb.js";
import { AttendaceItem, AttendanceModel } from "./attendance.model.js";
import SubjectRepo from "../subject/subject.repository.js";
export default class AttendanceRepo {
  constructor() {
    this.collection = "Attendance";
    this.subjectRepo = new SubjectRepo();
  }

  async getAttendanceById(subjectId, ownerId, section, branch) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne({
        subjectId,
        ownerId,
        section,
        branch,
      });

      if (result != null) {
        return result.attendance;
      } else {
        return [];
      }
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async addAttendance(
    count,
    dateTime,
    subjectId,
    ownerId,
    section,
    branch,
    data,
    remark
  ) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne({
        subjectId,
        ownerId,
        section,
        branch,
      });
      // console.log(result);
      if (result != null) {
        if (result.isMarked != null && !result.isMarked.includes(dateTime)) {
          result.isMarked.push(dateTime);
          // console.log(data);
          for (let i = 0; i < count; i++) {
            const attend = new AttendaceItem(
              data.date,
              data.attendance,
              remark
            );
            result.attendance.push(attend);

            await db.collection(this.collection).updateOne(
              { subjectId, ownerId, section, branch },
              {
                $set: {
                  attendance: result.attendance,
                  isMarked: result.isMarked,
                },
              }
            );
          }
          return ["200", "success"];
        } else if (result.isMarked == null) {
          for (let i = 0; i < count; i++) {
            const attend = new AttendaceItem(
              data.date,
              data.attendance,
              remark
            );
            result.attendance.push(attend);
          }
          await db
            .collection(this.collection)
            .updateOne(
              { subjectId, ownerId, section, branch },
              { $set: { attendance: result.attendance } }
            );

          return ["200", "success"];
        } else {
          return ["200", "Already filled"];
        }
      } else {
        return ["201", "no such class exist"];
      }
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async insertNewList(data) {
    try {
      // console.log(data);
      const db = getDB();
      const collection = await db.collection(this.collection);
      const temp = new AttendanceModel(
        data.ownerId,
        data.subjectId,
        data.course,
        data.branch,
        data.semester,
        data.section,
        data.session
      );
      await collection.insertOne(temp);
      return "success";
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async findList(data) {
    try {
      const db = getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne(data);
      if (result != null) return result;
    } catch (e) {
      return "error";
    }
  }
  async analysisScholarNo(fltr, schlNo) {
    try {
      // console.log(schlNo);
      // console.log(fltr);
      const db = getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne(fltr);
      // console.log(result);
      if (result != null) {
        const length = result.attendance.length;
        const attendanceData = result.attendance;
        const cumulativeAttendance = {};
        // console.log(length);
        if (length > 0) {
          attendanceData.forEach((dayAttendance) => {
            dayAttendance.attendance.forEach((entry) => {

              const scholarNo = entry["Scholar No."];
              const studentName = entry["Name of Student"];
              const isPresent = parseInt(entry["isPresent"]);
              if (scholarNo == schlNo && !cumulativeAttendance[scholarNo]) {
                cumulativeAttendance[scholarNo] = {
                  isPresent: 0,
                  name: studentName,
                };
              }
              if (scholarNo == schlNo && isPresent === 1) {
                cumulativeAttendance[scholarNo].isPresent++;
              }
            });
          });

        }
        // console.log(cumulativeAttendance);
        // console.log(length);
        return {
          total: length,
          present: cumulativeAttendance[schlNo]?.isPresent ?? 0,
        };
      } else {
        return {};
      }
    } catch (e) {
      console.log(e);
      return "something went wrong";
    }
  }
  async analysis(fltr) {
    // console.log(fltr);
    // fltr = {
    //   session: "2021-25",
    //   section: "01",
    //   subjectId: "65c12ea2c6d5522c1ed4ae45",
    //   branch: "CSE",
    // };
    try {
      // console.log(fltr);
      const db = getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne(fltr);
      // console.log(result);
      if (result != null) {
        const length = result.attendance.length;
        const attendanceData = result.attendance;
        const cumulativeAttendance = {};
        attendanceData.forEach((dayAttendance) => {
          dayAttendance.attendance.forEach((entry) => {
            const scholarNo = entry["Scholar No."];
            const studentName = entry["Name of Student"];
            const isPresent = parseInt(entry["isPresent"]);
            if (!cumulativeAttendance[scholarNo]) {
              cumulativeAttendance[scholarNo] = {
                isPresent: 0,
                name: studentName,
              };
            }
            if (isPresent === 1) {
              cumulativeAttendance[scholarNo].isPresent++;
            }
          });
        });

        // console.log(length);
        return { total: length, cumulativeAttendance };
      } else {
        return {};
      }
    } catch (e) {
      console.log(e);
      return "something went wrong";
    }
  }
  async dashbordHelper(ownerId) {
    try {
      const db = await getDB();
      // console.log(ownerId);
      const collection = await db.collection(this.collection);
      const result = await collection.find({ ownerId }).toArray();

      if (result.length > 0) {
        let data = {
          branch: new Set(),
          session: new Set(),
          section: new Set(),
          subject: new Set(),
        };
        for (let i = 0; i < result.length; i++) {
          data.branch.add(result[i].branch);

          data.session.add(result[i].session);

          data.section.add(result[i].section);
          console.log(result[i].subjectId);
          const sub = await this.subjectRepo.getSubjectById(
            result[i].subjectId
          );
          console.log(sub);

          data.subject.add(JSON.stringify(sub));
          console.log(data);
        }
        data.branch = Array.from(data.branch);
        data.section = Array.from(data.section);
        data.subject = Array.from(data.subject);
        data.session = Array.from(data.session);

        return await data;
      } else {
        let data = {
          branch: new Set([]),
          session: new Set([]),
          section: new Set([]),
          subject: new Set([]),
        };
        return data;
      }
    } catch (e) {
      console.log(e);
    }
  }
}
