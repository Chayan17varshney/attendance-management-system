import xlsx from "json-as-xlsx";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "../config/mongodb.js";

export default class AttendanceExcelMaker {
  constructor() {}
  async makeAttendance(fltr) {
    try {
      const db = await getDB();
      const collection = await db.collection("Attendance");
      const data = await collection.findOne(fltr);
      // console.log(data);
      const sheetName = uuidv4();
      // console.log(sheetName);

      let heading = [
        { label: "Scholar No", value: "ScholarNo" }, // Top level data
        { label: "Name of Student", value: "Name of Student" },
      ];
      let content = [];
      if (data != null && data.attendance.length > 0) {
        const temp = data.attendance;
        for (let i = 0; i < temp.length; i++) {
          heading.push({
            label: temp[i].date + `(${i})`,
            value: "isPresent" + i,
          });
        }
        for (let j = 0; j < temp[0].attendance.length; j++) {
          content.push({
            ScholarNo: temp[0].attendance[j]["Scholar No."],
            "Name of Student": temp[0].attendance[j]["Name of Student"],
          });
        }
        for (let k = 2; k < heading.length; k++) {
          for (let j = 0; j < temp[0].attendance.length; j++) {
            content[j][heading[k].value] =
              temp[k - 2].attendance[j]["isPresent"];
          }
        }
      }
      // console.log(content);

      let result = [
        {
          sheet: "Attendance",
          columns: heading,
          content: content,
        },
      ];

      let settings = {
        fileName: "./src/data/" + sheetName, // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
        RTL: false, // Display the columns from right-to-left (the default value is false)
      };

      const file = await xlsx(result, settings);
      // console.log(sheetName);
      return sheetName;
    } catch (e) {
      console.log(e);
      console.log("Error");
    }
  }
}
