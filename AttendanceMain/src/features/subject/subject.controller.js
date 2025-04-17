// import { error } from "winston";
import SubjectRepo from "./subject.repository.js";

export default class SubjectController {
  constructor() {
    this.repo = new SubjectRepo();
  }

  async getSubject(req, res) {
    try {
      const { id, subjectCode } = req.query;
      if (id != null) {
        res.status(200).send(await this.repo.getSubjectById(id));
      } else if (subjectCode != null) {
        res.status(200).send(await this.repo.getSubjectByCode(subjectCode));
      }
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
  async addSubject(req, res) {
    try {
      const { subjectCode } = req.body;
      if (subjectCode != null) {
        const result = await this.repo.getSubjectByCode(subjectCode);
        if (result == null) {
          const result2 = await this.repo.addSubject(req.body);
          if (result2 != null) {
            res.status(200).send({ message: "Success" });
          } else {
            throw new ApplicationError("something went wrong", 500);
          }
        } else {
          res.status(201).send({ message: "Subject Already Exist" });
        }
      } else {
        res.status(500).send({ message: "Something Went Wrong" });
      }
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
}
