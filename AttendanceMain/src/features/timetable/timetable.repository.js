import { getDB, getSession } from "../../config/mongodb.js";
import { TimeTableModel, subjectModel } from "./timetable.model.js";
import { ObjectId } from "mongodb";
// import { Collection, ObjectId } from "mongodb";
import SubjectRepo from "../subject/subject.repository.js";
import AttendanceRepo from "../attendance/attendance.ropository.js";
import UserRepo from "../user/user.repository.js";
import { use } from "bcrypt/promises.js";
import { request } from "https";

export default class TimeTableRepo {
  constructor() {
    this.collection = "TimeTable";
    this.attendanceRepo = new AttendanceRepo();
    this.userRepo = new UserRepo();
  }
  async getToday(ownerId) {
    try {
      // console.log(ownerId);
      const db = await getDB();
      const collection = await db.collection(this.collection);
      // console.log(collection);
      const result = await collection.findOne({ ownerId });
      if (result == null) {
        return {
          TimeTable: [],
          Temporary: [],
        };
      } else {
        const date = new Date();
        const day = date.getDay();
        return {
          TimeTable: result.TimeTable[day],
          Temporary: result.assignedToMe[day],
        };
      }
    } catch (e) {
      throw new ApplicationError("something went wrong", 500);
    }
  }

  async getTimeTableFromDay(day, ownerId) {
    try {
      // console.log(day, ownerId);
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne({ ownerId });
      // console.log(result);
      if (result == null) {
        return {
          TimeTable: [],
          Temporary: [],
        };
      } else {
        return {
          TimeTable: result.TimeTable[day],
          Temporary: result.assignedToMe[day],
        };
      }
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async addClass(data) {
    // console.log(data);
    const session = await getSession();
    try {
      const ownerId = data.ownerId;
      const db = await getDB();

      const collection = await db.collection(this.collection);
      const result = await collection.findOne({ ownerId }); /////check if already exist  this user
      // console.log(result);
      if (result == null) {
        let tt;
        await session.withTransaction(async () => {
          tt = new TimeTableModel(data.ownerId);
          const sub = await new SubjectRepo().getSubjectByCode(
            data.subjectCode
          );
          if (sub == null) {
            throw "Subject Not found";
          }
          const subject = new subjectModel(
            sub,
            data.branch,
            data.semester,
            data.timing,
            data.section,
            data.location,
            data.course,
            data.session
          );
          tt.TimeTable[data.day].push(subject);
          await collection.insertOne(tt);

          ///////Automatically Adding  attendance list//////
          const tempdata = {
            ownerId: ownerId.toString(),
            subjectId: sub._id,
            course: data.course,
            branch: data.branch,
            semester: data.semester,
            section: data.section,
            session: data.session,
          };

          const isAvail = await this.attendanceRepo.findList(tempdata);
          if (!isAvail) {
            await this.attendanceRepo.insertNewList(tempdata);
          }

          //////Automatically Adding  attendance list//////
        });
        await session.commitTransaction();
        return tt;
      } else {
        // console.log(result.TimeTable[data.day]);
        await session.withTransaction(async () => {
          const sub = await new SubjectRepo().getSubjectByCode(
            data.subjectCode
          );
          if (sub == null) {
            throw "Subject Not found";
          }
          const subject = new subjectModel(
            sub,
            data.branch,
            data.semester,
            data.timing,
            data.section,
            data.location,
            data.course,
            data.session
          );
          const str = data.day;
          const dat = result.TimeTable[data.day].push(subject);
          await db
            .collection(this.collection)
            .updateOne({ ownerId }, { $set: { TimeTable: result.TimeTable } });

          ///////Automatically Adding  attendance list//////
          const tempdata = {
            ownerId: ownerId.toString(),
            subjectId: sub._id.toString(),
            course: data.course,
            branch: data.branch,
            semester: data.semester,
            section: data.section,
            session: data.session,
          };

          const isAvail = await this.attendanceRepo.findList(tempdata);
          if (!isAvail) {
            await this.attendanceRepo.insertNewList(tempdata);
          }
          //////Automatically Adding  attendance list//////
        });
        await session.commitTransaction();
        return result;
      }
    } catch (e) {
      console.log(e);
      // throw new ApplicationError("something went wrong", 500);
    } finally {
      await session.endSession();
    }
  }
  async addNewList(ownerId) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne({ ownerId });

      if (result == null) {
        const tt = new TimeTableModel(ownerId);
        await collection.insertOne(tt);
        return { message: "Successful" };
      } else {
        return { message: "Already Inserted" };
      }
    } catch (e) {
      console.log(e);
      return;
    }
  }

  async modifyData(oldData, newData) {}
  async replacement(data) {
    try {
      const db = await getDB();
      const prof = await this.userRepo.findByEmployeeCode(data.requested);
      const me = await this.userRepo.findByObjectId(data.ownerId);
      //checking the existance of both
      if (me && prof) {
        const session = await getSession();
        const collection = await db.collection(this.collection);

        //finding the target
        const user = await collection.findOne({
          ownerId: prof._id,
        });
        if (user.request) {
          await session.withTransaction(async () => {
            const id = new ObjectId();
            //updating target
            user.request.push({
              id: id,
              timetable: data.subject,
              date: data.date.split(" ")[0],
              from: {
                id: me._id,
                name: me.name,
                employeeCode: me.employeeCode,
                department: me.department,
                phone: me.phone,
              },
            });
            // console.log(user.request);
            await db
              .collection(this.collection)
              .updateOne(
                { ownerId: prof._id },
                { $set: { request: user.request } }
              );

            //updating user
            const user2 = await collection.findOne({
              ownerId: me._id,
            });
            user2.meRequestedOther.push({
              id: id,
              date: data.date.split(" ")[0],
              timetable: data.subject,
              to: {
                id: prof._id,
                name: prof.name,
                employeeCode: prof.employeeCode,
                department: prof.department,
                phone: prof.phone,
              },
            });
            // console.log(user2.meRequestedOther);
            await db
              .collection(this.collection)
              .updateOne(
                { ownerId: me._id },
                { $set: { meRequestedOther: user2.meRequestedOther } }
              );
          });
          await session.commitTransaction();

          return "Success";
        } else {
          return "Cannot process this request";
        }
      } else {
        return "Data is incorrect";
      }
    } catch (e) {
      console.log(e);
    }
  }
  async requestList(ownerId) {
    try {
      // console.log(ownerId);

      const db = await getDB();
      const collection = await db.collection(this.collection);
      const user = await collection.findOne({ ownerId });
      // console.log(user);
      return user.request;
    } catch (e) {
      console.log(e);
    }
  }
  async acceptRequest(data) {
    console.log(data, "ra");
    try {
      // console.log(data);
      const db = await getDB();

      const results = await db
        .collection(this.collection)
        .find(
          {
            ownerId: data.ownerId,
            request: {
              $elemMatch: { id: new ObjectId(data.id) },
            },
          },
          {
            projection: { "request.$": 1 }, // Use $ to project only the matching array element in 'request'
          }
        )
        .toArray();
      // console.log("Results:", results.request);
      const matchedRequest = results.length > 0 ? results[0].request[0] : null;
      const date = new Date(matchedRequest.date);
      const targetIndex = date.getDay(); // Replace this with the desired index for the sub-array in `assignedToMe`

      if (matchedRequest) {
        let tt = matchedRequest.timetable;
        tt = { ...tt, ownerId: matchedRequest.from.id };

        // Update the document by pushing `tt` to the specific sub-array at `assignedToMe[targetIndex]`
        await db.collection(this.collection).updateOne(
          { ownerId: data.ownerId },
          {
            $push: { [`assignedToMe.${targetIndex}`]: tt }, // Dynamic field to push `tt` into the specified sub-array
            $pull: { request: { id: new ObjectId(data.id) } }, // Remove the matched request from `request`
          }
        );
        await db.collection(this.collection).updateOne(
          { ownerId: tt.ownerId },
          {
            $push: { [`meAssignedToOther.${targetIndex}`]: tt },
            $pull: { meRequestedOther: { id: new ObjectId(data.id) } },
          }
        );

        return "success";
      } else {
        return "No matching request found.";
      }
    } catch (e) {
      console.log(e);
      return "something went wrong!";
    }

    // try {
    //   const db = await getDB();
    //   const collection = await db.collection(this.collection);
    //   const user = await collection.findOne({ ownerId: data.ownerId });
    //   if (user) {
    //     const list = user.request;

    //     if (list) {
    //       for (let i = 0; i < list.length; i += 1) {
    //         if (list[i].id.toString() == data.id) {
    //           const dat = list[i];
    //           list.splice(i, 1);
    //           const myId = data.ownerId;
    //           const requesterId = await this.userRepo.findByEmployeeCode(
    //             dat.from.employeeCode
    //           );

    //           const myData = collection.findOne({
    //             ownerId: new ObjectId(myId),
    //           });

    //           await db
    //             .collection(this.collection)
    //             .updateOne({ ownerId: myId }, { $set: { request: list } });
    //           await db
    //             .collection(this.collection)
    //             .updateOne({ ownerId: requesterId }, { $set: {} });

    //           break;
    //         }
    //       }
    //     }
    //   }
    // } catch (e) {
    //   console.log(e);
    // }
  }

  async rejectRequest(data) {
    try {
      // console.log(data);
      const db = await getDB();

      const results = await db
        .collection(this.collection)
        .find(
          {
            ownerId: data.ownerId,
            request: {
              $elemMatch: { id: new ObjectId(data.id) },
            },
          },
          {
            projection: { "request.$": 1 }, // Use $ to project only the matching array element in 'request'
          }
        )
        .toArray();
      // console.log("Results:", results.request);
      const matchedRequest = results.length > 0 ? results[0].request[0] : null;
      const date = new Date(matchedRequest.date);
      const targetIndex = date.getDay(); // Replace this with the desired index for the sub-array in `assignedToMe`

      if (matchedRequest) {
        let tt = matchedRequest.timetable;
        tt = { ...tt, ownerId: matchedRequest.from.id };

        // Update the document by pushing `tt` to the specific sub-array at `assignedToMe[targetIndex]`
        await db.collection(this.collection).updateOne(
          { ownerId: data.ownerId },
          {
            $pull: { request: { id: new ObjectId(data.id) } }, // Remove the matched request from `request`
          }
        );
        await db.collection(this.collection).updateOne(
          { ownerId: tt.ownerId },
          {
            $pull: { meRequestedOther: { id: new ObjectId(data.id) } },
          }
        );

        return "success";
      } else {
        return "No matching request found.";
      }
    } catch (e) {
      console.log(e);
    }
  }
  async findAndRemoveTimetable(ownerId, day, timetableDetails) {
    const db = await getDB(); // Ensure `getDB()` connects to your database properly
    const query = {
      ownerId: new ObjectId(ownerId),
    };
    // console.log(await db.collection("TimeTable").findOne(query));
    const pullCriteria = {
      // "subject._id": new ObjectId(timetableDetails.subject._id), // Ensure this is an ObjectId
      branch: timetableDetails.branch,
      semester: timetableDetails.semester,
      timing: timetableDetails.timing,
      section: timetableDetails.section,
      location: timetableDetails.location,
      course: timetableDetails.course,
      session: timetableDetails.session,
      ownerId: new ObjectId(timetableDetails.ownerId),
    };

    // Construct the update operation
    const update = {
      $pull: {
        [`assignedToMe.${day}`]: pullCriteria,
      },
    };

    // Execute the update operation
    const result = await db.collection("TimeTable").updateOne(query, update);

    if (result.modifiedCount > 0) {
      const query = {
        ownerId: new ObjectId(timetableDetails.ownerId),
      };
      const pullCriteria = {
        // "subject._id": new ObjectId(timetableDetails.subject._id), // Ensure this is an ObjectId
        branch: timetableDetails.branch,
        semester: timetableDetails.semester,
        timing: timetableDetails.timing,
        section: timetableDetails.section,
        location: timetableDetails.location,
        course: timetableDetails.course,
        session: timetableDetails.session,
        ownerId: new ObjectId(timetableDetails.ownerId),
      };

      // Construct the update operation
      const update = {
        $pull: {
          [`meAssignedToOther.${day}`]: pullCriteria,
        },
      };

      // Execute the update operation
      const result2 = await db.collection("TimeTable").updateOne(query, update);

      return {
        success: true,
        message: "Timetable entry removed successfully",
      };
    } else {
      return {
        success: false,
        message: "No matching timetable entry found",
      };
    }
  }
  catch(error) {
    console.error("Error removing timetable:", error);
    return {
      success: false,
      message: "An error occurred while removing the timetable entry",
    };
  }
}
