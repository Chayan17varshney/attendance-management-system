import { ObjectId } from "mongodb";
import TimeTableRepo from "./timetable.repository.js";

export default class TimeTableController {
  constructor() {
    this.Repo = new TimeTableRepo();
  }

  async reschedule(req, res) {
    try {
    } catch (e) {
      console.log(e);
      return res.status(500).send("something went wrong");
    }
  }
  //////To get Time Table
  async getTimeTable(req, res) {
    try {
      // console.log(req.query);
      const ownerId = new ObjectId(req.userId);
      // console.log(ownerId);
      const { day } = req.query;
      //   console.log(day);
      if (day == null) {
        const timeTable = await this.Repo.getToday(ownerId);
        // console.log(timeTable);
        res.status(200).send(timeTable);
      } else {
        const timeTable = await this.Repo.getTimeTableFromDay(day, ownerId);
        // console.log(timeTable);
        res.status(200).send(timeTable);
      }
    } catch (e) {
      console.log(e);
      return res.status(500).send("something went wrong");
    }
  }

  ///To Add New Class To Schedule
  async addClass(req, res) {
    try {
      const ownerId = new ObjectId(req.userId);
      // console.log(ownerId);
      const {
        day,
        subject,
        branch,
        semester,
        timing,
        section,
        location,
        subjectCode,
        course,
        session,
      } = req.body;
      const result = await this.Repo.addClass({
        ownerId,
        day,
        subject,
        branch,
        semester,
        timing,
        section,
        location,
        subjectCode,
        course,
        session,
      });
      // console.log(result);
      if (result) {
        res.status(200).send({
          message: "Seccessful",
        });
      } else {
        res.status(200).send({
          message: "Something Went Wrong!",
        });
      }
    } catch (e) {
      console.log(e);
      return res.status(500).send("something went wrong");
    }
  }

  async replacement(req, res) {
    try {
      const ownerId = req.userId;
      // const ownerId = "66c482fe747627b343525b3f";
      const data = req.body;
      console.log(req.body);
      const t1 = new Date().toISOString().split("T")[0];
      const date = req.body.date.split(" ")[0];
      // console.log(date);
      // console.log(t1);
      // console.log(t1 <= date);
      if (t1 <= date) {
        let modifiedData = { ...data, ownerId: ownerId };
        // console.log(modifiedData);
        const result = await this.Repo.replacement(modifiedData);
        res.send({ message: result });
      } else {
        res.send({ message: "Invalid Request" });
      }
    } catch (e) {
      console.log(e);
    }
  }
  async requestList(req, res) {
    /////For temprory class///
    try {
      const result = await this.Repo.requestList(new ObjectId(req.userId));
      res.send({ list: result });
    } catch (e) {
      console.log(e);
      res.send();
    }
  }
  async acceptRequest(req, res) {
    /////For temprory class///
    try {
      const data = req.body;

      const result = await this.Repo.acceptRequest({
        ...data,
        ownerId: new ObjectId(req.userId),
      });
      res.send({ message: result });
    } catch (e) {
      console.log(e);
      res.send();
    }
  }

  async rejectRequest(req, res) {
    /////For temprory class///
    try {
      const data = req.body;
      const result = await this.Repo.rejectRequest({
        ...data,
        ownerId: new ObjectId(req.userId),
      });
      res.send({ message: result });
    } catch (e) {
      console.log(e);
    }
  }
}
