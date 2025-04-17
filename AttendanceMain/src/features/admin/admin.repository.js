import { getDB } from "../../config/mongodb.js";
import { ObjectId } from "mongodb";
export default class AdminRepository {
  constructor() {
    this.collection = "Admin";
  }

  async signUp(newUser) {
    try {
      // console.log(newUser);
      const db = await getDB();
      // console.log(db);
      const collection = await db.collection(this.collection);
      await collection.insertOne(newUser);
      return newUser;
    } catch (err) {
      throw new ApplicationError("something went wrong", 500);
    }
  }

  async findByEmployeeCode(employeeCode) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      //   console.log(await collection.findOne({ employeeCode }));
      return await collection.findOne({ employeeCode });
    } catch (e) {
      console.log(e);
      // throw new ApplicationError("something went wrong", 500);
    }
  }
  async removeClass(data) {
    try {
      const db = await getDB();
      // const collection = await db.collection("TimeTable");

      const day = data.day; // Variable for the day
      const classToDelete = data.item;

      const query = {
        [`TimeTable.${day}`]: {
          $elemMatch: {
            "subject._id": new ObjectId(classToDelete.subject._id),
            branch: classToDelete.branch,
            semester: classToDelete.semester,
            timing: classToDelete.timing,
            section: classToDelete.section,
            location: classToDelete.location,
            course: classToDelete.course,
            session: classToDelete.session,
          },
        },
      };

      const update = {
        $pull: {
          [`TimeTable.${day}`]: {
            "subject._id": new ObjectId(classToDelete.subject._id),
            branch: classToDelete.branch,
            semester: classToDelete.semester,
            timing: classToDelete.timing,
            section: classToDelete.section,
            location: classToDelete.location,
            course: classToDelete.course,
            session: classToDelete.session,
          },
        },
      };

      // Execute the query
      await db.collection("TimeTable").updateOne(query, update);
      return { message: "Success" };
    } catch (e) {
      console.log(e);
    }
  }
}
