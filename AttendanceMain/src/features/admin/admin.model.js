export default class AdminModel {
  constructor(employeeCode, name, password, email, phone, role) {
    (this.name = name),
      (this.password = password),
      (this.employeeCode = employeeCode),
      (this.email = email),
      (this.phone = phone),
      (this.role = role);
  }
}
