export default class subjectModel {
  constructor(subjectName, subjectCode, department, isElective = false) {
    (this.subjectCode = subjectCode),
      (this.subjectName = subjectName),
      (this.department = department),
      (this.isElective = isElective);
  }
}
