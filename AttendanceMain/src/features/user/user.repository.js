import { getDB } from "../../config/mongodb.js";
import { ObjectId } from "mongodb";
// import { SecFacultyMap } from "./user.model.js";

export default class userRepository {
  constructor() {
    this.collection = "User";
  }

  async signUp(newUser) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      await collection.insertOne(newUser);
      return newUser;
    } catch (err) {
      throw new ApplicationError("something went wrong", 500);
    }
  }

  async findByEmployeeCode(employeeCode) {
    try {
      // console.log(employeeCode);
      const db = await getDB();
      const collection = await db.collection(this.collection);
      // console.log(collection);

      // console.log(await collection.findOne({ employeeCode: employeeCode }));
      return await collection.findOne({ employeeCode });
    } catch (e) {
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async findByObjectId(id) {
    try {
      // console.log(id);
      const db = await getDB();
      const collection = await db.collection(this.collection);
      // console.log(new ObjectId(id));

      // console.log(await collection.findOne({ _id: new ObjectId(id) }));
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async changePassword(id, newPassword) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { password: newPassword } }
      );
      // console.log(result);
    } catch (e) {
      console.log(e);
    }
  }
}
