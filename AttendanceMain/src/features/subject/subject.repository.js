import { getDB } from "../../config/mongodb.js";
import subjectModel from "./subject.model.js";
import { ObjectId } from "mongodb";

export default class SubjectRepo {
  constructor() {
    this.collection = "Subject";
  }
  async getSubjectByCode(subCode) {
    try {
      const db = getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne({ subjectCode: subCode });

      return result;
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async getSubjectById(id) {
    try {
      // console.log(id);
      const db = getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne({ _id: new ObjectId(id) });
      return result;
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async addSubject(data) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const sub = new subjectModel(
        data.subjectName,
        data.subjectCode,
        data.department,
        data.isElective
      );
      return await collection.insertOne(sub);
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
}
