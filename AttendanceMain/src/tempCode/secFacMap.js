
import { getDB } from "../config/mongodb";

export default async function generateSectionFacultyMap() {
    try {
      const db = getDB();

      const timetables = await db.collection("TimeTable").find({}).toArray();
  
      if (!timetables.length) {
        console.log("No timetable data found.");
        return;
      }
  
      const sectionMap = {};
  
      timetables.forEach(timetable => {
        for (const day in timetable.TimeTable) {
          timetable.TimeTable[day].forEach(entry => {
            // const sectionKey = `${entry.course}-${entry.session}-${entry.section}`; // Unique section identifier
            const sectionKey = `${entry.course}-${entry.session}-${entry.section}-${entry.branch}`;
  
  
            if (!sectionMap[sectionKey]) {
              sectionMap[sectionKey] = {
                batch: entry.session,
                department: entry.branch || "Unknown",
                section: entry.section,
                course: entry.course,
                map: []
              };
            }
  
            // Avoid duplicate subject entries
            const exists = sectionMap[sectionKey].map.some(
              sub => sub.subCode === entry.subject.subjectCode
            );
  
            if (!exists) {
              sectionMap[sectionKey].map.push({
                subCode: entry.subject.subjectCode,
                subjectName: entry.subject.subjectName,
                subjectId: entry.subject._id.toString(),
                ownerId: timetable.ownerId.toString()
              });
            }
          });
        }
      });
  
      // Convert object to array
      const result = Object.values(sectionMap);
  
      // Insert into sectionFacultyMap collection
      const collection = db.collection("SectionFacultyMap");
      await collection.deleteMany({}); // Optional: Clears existing data
      await collection.insertMany(result);
  
      console.log("Section-Faculty Mapping inserted successfully.");
  
    } catch (error) {
      console.error("Error:", error);
    }
  }