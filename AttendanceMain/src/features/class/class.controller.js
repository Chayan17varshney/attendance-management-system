import ClassRepository from "./class.repository.js";
import xlsx from "xlsx";
import path from "path";
const __dirname = path.resolve();

export default class ClassController {
  constructor() {
    this.repo = new ClassRepository();
  }

  async getStudentList(req, res) {
    try {
      // console.log();
      const { sec } = req.query;
      const workbook = xlsx.readFile(__dirname + "/src/data/Cse01.xlsx"); // Step 2
      let workbook_sheet = workbook.SheetNames; // Step 3
      let workbook_response;
      if (sec == "CSE01") {
        workbook_response = xlsx.utils.sheet_to_json(
          workbook.Sheets[workbook_sheet[0]]
        );
      } else if (sec == "CSE02") {
        workbook_response = xlsx.utils.sheet_to_json(
          workbook.Sheets[workbook_sheet[1]]
        );
      } else if (sec == "CSE03") {
        workbook_response = xlsx.utils.sheet_to_json(
          workbook.Sheets[workbook_sheet[2]]
        );
      } else {
        workbook_response = xlsx.utils.sheet_to_json(
          workbook.Sheets[workbook_sheet[3]]
        );
      }
      // console.log(workbook_response);
      res.json({
        section: sec,
        data: workbook_response,
        subCode: "CSE235",
      });
    } catch (e) {
      console.log(e);
      throw new ApplicationError("something went wrong", 500);
    }
  }
}
