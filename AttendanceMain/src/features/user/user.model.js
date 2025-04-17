export default class UserModel {
  constructor(
    name,
    password,
    about,
    employeeCode,
    role,
    department,
    email,
    phone,
    abbv
  ) {
    (this.name = name),
      (this.password = password),
      (this.about = about),
      (this.employeeCode = employeeCode),
      (this.role = role),
      (this.department = department),
      (this.email = email),
      (this.phone = phone),
      (this.abbreviation = abbv);
  }
}
