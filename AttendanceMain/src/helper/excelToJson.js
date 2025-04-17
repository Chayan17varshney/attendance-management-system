import xlsx from "xlsx";
import path from "path";
const __dirname = path.resolve();

export default class ExcelToJson {
  constructor() {}
  convert() {
    const workbook = xlsx.readFile(__dirname + "/src/data/DIP-CSE1.xlsx");
    let workbook_sheet = workbook.SheetNames;
    const workbook_response = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook_sheet[0]]
    );
    return workbook_response;
    console.log(workbook_response);
  }
}
