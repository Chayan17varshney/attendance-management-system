import SubjectRepo from "../subject/subject.repository.js";
import userRepository from "../user/user.repository.js";
import sectionFacultyMapRepository from "./sectionFacultyMap.repository.js";

export default class SectionFacultyMapController {
  constructor() {
    (this.secFacRepo = new sectionFacultyMapRepository()),
      (this.subjectRepo = new SubjectRepo()),
      (this.userRepo = new userRepository());
  }
  async addSectionFacultyMap(req, res) {
    try {
      const data = req.body;
      // console.log(data);
      const { Batch, Department, Section, Course } = req.body;

      const check = Batch && Department && Section && Course;
      //   console.log(D);
      if (check) {
        let newMap = {
          Batch,
          Department,
          Section,
          Course,
          mp: [],
        };
        const verifyDupli = await this.secFacRepo.findSection({
          batch: Batch,
          department: Department,
          section: Section,
          course: Course,
        });
        if (!verifyDupli) {
          // Object.keys(data).forEach(async (k) => {
          for (const k of Object.keys(data)) {
            console.log(k);
            if (
              k != "Batch" &&
              k != "Department" &&
              k != "Section" &&
              k != "Course"
            ) {
              const sub = await this.subjectRepo.getSubjectByCode(k);
              console.log(sub);
              let newSub = {};
              if (sub != null) {
                newSub["subCode"] = sub.subjectCode;
                newSub["subjectName"] = sub.subjectName;
                newSub["subjectId"] = sub._id.toString();
              } else {
                res.send("something Went Wrong");
                return;
              }
              const fac = await this.userRepo.findByEmployeeCode(data[k]);
              if (fac != null) {
                newSub["ownerId"] = fac._id.toString();
              } else {
                res.send("something Went Wrong");
                return;
              }
              // console.log(newSub);
              newMap.mp.push(newSub);
            }
          }
          // console.log(newMap);

          const result = await this.secFacRepo.facultySecMap(newMap);
          res.send(result);
        } else {
          res.send("Already Exist");
        }
      } else {
        res.send("Insufficient Data");
      }
    } catch (e) {
      console.log(e);
      res.send("something Went Wrong");
    }
  }
}
