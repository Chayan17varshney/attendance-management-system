class subjectModel {
  constructor(
    subject,
    branch,
    semester,
    timing,
    section,
    location,
    course,
    session
  ) {
    (this.subject = subject),
      (this.branch = branch),
      (this.semester = semester),
      (this.timing = timing),
      (this.section = section),
      (this.location = location),
      (this.course = course),
      (this.session = session);
  }
}

class TimeTableModel {
  constructor(ownerId) {
    (this.ownerId = ownerId),
      (this.TimeTable = timeTableList),
      ////////for rescheduling to me////////
      (this.assignedToMe = timeTableList),
      (this.meAssignedToOther = timeTableList),
      (this.request = []),
      (this.meRequestedOther = []);
  }
}

const timeTableList = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
};

export { subjectModel, TimeTableModel };
