import { getDB } from "../../config/mongodb.js";
import StudentModel from "./student.model.js";
import { ObjectId } from "mongodb";

export default class StudentRepo {
  constructor() {
    this.collection = "Student";
    this.electiveCollection = "ElectiveStudent";
    this.attendanceCollection = "Attendance";
  }
  async addStudent(data) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const check = await collection.findOne({
        scholarNumber: data.scholarNumber,
      });
      // console.log(check);
      if (check) {
        return "Student Already Exist";
      } else {
        const newStudent = new StudentModel(
          data.scholarNumber,
          data.studentName,
          data.branch,
          data.section,
          data.batch
        );
        const res = await collection.insertOne(newStudent);
        if (res) {
          return "Success";
        } else {
          throw "Something Went Wrong!";
          // return "Something Went Wrong!";
        }
      }
    } catch (e) {
      console.log(e);
      return "Some Internal Error";
    }
  }

  async findByScholarNumber(scholarNumber) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const check = await collection.findOne({
        scholarNumber: scholarNumber,
      });
      if (check) {
        return check;
      } else {
        throw "Error";
      }
    } catch (e) {
      console.log(e);
      return "Some Internal Error";
    }
  }
  async updateStudentDetail(field, scholarNumber, newVal) {
    try {
      if (field != "scholarNumber") {
        const db = await getDB();
        const collection = await db.collection(this.collection);
        const result = await collection.updateOne(
          { scholarNumber: scholarNumber },
          { $set: { field: newVal } }
        );
        if (result) {
          return "Successfully Updated";
        } else {
          throw "Error";
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  async findByFilter(filtr) {
    try {
      const db = await getDB();
      const attendanceCollection = await db.collection(
        this.attendanceCollection
      );
      const checkAttendance = await attendanceCollection.findOne({
        ownerId: filtr.ownerId.toString(),
        branch: filtr.branch,
        subjectId: filtr.subjectId,
        session: filtr.batch,
        section: filtr.section,
      });

      if (
        filtr.temp == null &&
        checkAttendance.isMarked != null &&
        checkAttendance.isMarked.includes(filtr.dateTime)
      ) {
        return "already Filled";
      }

      const collection = await db.collection(this.collection);
      let result = await collection
        .find({
          branch: filtr.branch,
          section: filtr.section,
          batch: filtr.batch,
        })
        .toArray();
      result.sort(function (a, b) {
        var keyA = a.scholarNumber,
          keyB = b.scholarNumber;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });
      return result;
    } catch (e) {
      console.log(e);
      return "Error";
    }
  }
  // async findElectiveList(filtr) {
  //   try {
  //     const db = await getDB();
  //     const collection = await db.collection(this.electiveCollection);
  //     let result = await collection.findOne(filtr);
  //     // console.log(result);
  //     return result == null ? [] : result.list;
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }
  async findElectiveList(filtr) {
    try {
      const db = await getDB();
      const attendanceCollection = await db.collection(
        this.attendanceCollection
      );
      const checkAttendance = await attendanceCollection.findOne({
        ownerId: filtr.ownerId.toString(),
        branch: filtr.branch,
        subjectId: filtr.subjectId,
        session: filtr.batch,
        section: filtr.section,
      });
      // console.log(checkAttendance);
      if (
        filtr.temp == null &&
        checkAttendance.isMarked != null &&
        checkAttendance.isMarked.includes(filtr.dateTime)
      ) {
        return "already Filled";
      }

      const collection = await db.collection(this.electiveCollection);
      let result = await collection.findOne({
        ownerId: filtr.ownerId,
        branch: filtr.branch,
        section: filtr.section,
        batch: filtr.batch,
        subjectId: filtr.subjectId,
      });
      // console.log(result);
      return result == null ? [] : result.list;
    } catch (e) {
      console.log(e);
    }
  }
  async addElectiveList(data) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.electiveCollection);
      let result = await collection.insertOne(data);
      return result;
    } catch (e) {
      console.log(e);
    }
  }
}
