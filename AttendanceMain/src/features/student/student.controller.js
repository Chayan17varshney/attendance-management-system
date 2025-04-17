import SubjectRepo from "../subject/subject.repository.js";
import StudentRepo from "./student.repository.js";
import { ObjectId } from "mongodb";

export default class StudentController {
  constructor() {
    this.repo = new StudentRepo();
    this.subjectRepo = new SubjectRepo();
  }
  async findStudentByScholar(req, res) {
    try {
      const result = await this.repo.findByScholarNumber(
        req.body.scholarNumber
      );
      res.status(200).send(result);
    } catch (e) {
      console.log(e);
      res.status(200).send("Something went wrong");
    }
  }
  async addStudent(req, res) {
    try {
      //   const data = req.body;
      const { studetName, scholarNumber, branch, section } = req.body;
      const check = studentName && scholarNumber && branch && section && batch;
      if (check) {
        let student = {
          studentName,
          scholarNumber,
          branch,
          section,
          batch,
        };
        const result = this.repo.addStudent(student);
        if (result == "Success") {
          res.send("Successfully Added");
        } else {
          res.send("Something went wrong");
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).send("something went wrong");
    }
  }
  async addElectiveList(req, res) {
    try {
      const ownerId = new ObjectId(req.userId);
      const { branch, section, batch, list } = req.body;
      const b = branch.toUpperCase();
      if (branch && section && batch) {
        res.send(
          await this.repo.addElectiveList({
            ownerId,
            b,
            section,
            batch,
            list,
          })
        );
      } else {
        res.send({ message: "Check input fields" });
      }
    } catch (e) {
      console.log(e);
      res.send("Error");
    }
  }
  async studentList(req, res) {
    try {
      // console.log(req.query);
      const ownerId = new ObjectId(req.userId);
      const { branch, section, batch, isElective, subjectId, dateTime, temp } =
        req.query;
      // console.log(req.query);

      if (isElective != "null" && isElective != null && isElective != "false") {
        // console.log(2);
        const result = await this.repo.findElectiveList({
          ownerId,
          branch,
          section,
          batch,
          subjectId,
          dateTime,
        });
        // console.log(result);
        if (Array.isArray(result)) res.send(result);
        else {
          res.status(200).send({ message: result });
        }
      } else {
        // console.log(4);
        // console.log(branch);
        const result = await this.repo.findByFilter({
          dateTime,
          ownerId,
          branch,
          section,
          batch,
          subjectId,
          temp,
        });

        if (Array.isArray(result)) res.send(result);
        else {
          res.status(200).send({ message: result });
        }
        // console.log(result);
        // res.send(result);
      }
    } catch (e) {
      console.log(e);
      res.send("Something Went Wrong!");
    }
  }
}
