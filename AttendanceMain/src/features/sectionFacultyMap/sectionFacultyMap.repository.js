import { getDB } from "../../config/mongodb.js";
import { SecFacultyMap } from "./sectionFacultyMap.model.js";

export default class sectionFacultyMapRepository {
  constructor() {
    this.collection = "SectionFacultyMap";
  }

  async findSection(filtr) {
    try {
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const result = await collection.findOne(filtr);
      return result;
    } catch (e) {
      console.log(e);
    }
  }
  async facultySecMap(data) {
    try {
      const newData = new SecFacultyMap(
        data.Batch,
        data.Department,
        data.Section,
        data.Course,
        data.mp
      );
      const db = await getDB();
      const collection = await db.collection(this.collection);
      const check = await collection.insertOne(newData);
      if (check) {
        return "Success";
      } else {
        return "Something Went Wrong";
      }
    } catch (e) {
      console.log(e);
      return "Some internal Error";
    }
  }
}
