export class AttendaceItem {
  constructor(date, attendance, remark = "") {
    (this.date = date), (this.attendance = attendance), (this.remark = remark);
  }
}

export class AttendanceModel {
  constructor(ownerId, subjectId, course, branch, semester, section, session) {
    (this.ownerId = ownerId),
      (this.subjectId = subjectId),
      (this.course = course),
      (this.branch = branch),
      (this.semester = semester),
      (this.section = section),
      (this.session = session),
      (this.attendance = []),
      (this.isMarked = []);
  }
}
