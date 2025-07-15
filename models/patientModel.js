const db = require("../utils/databaseUtil");

module.exports = class Patient {
  static async getAll() {
    try {
      const [rows, fields] = await db.execute('SELECT SSN, Name, `Contact-No`, BloodType, Gender FROM patient');
      return rows;
    } catch (err) {
      throw err;
    }
  }

  static async checkLogin(name, password) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM patient WHERE name = ? AND password = ?',
        [name, password]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      throw err;
    }
  }

  static async create(patientData) {
    try {
      const [result] = await db.execute(
        'INSERT INTO patient (Name, SSN, `Contact-No`, BloodType, Gender, Password) VALUES (?, ?, ?, ?, ?, ?)', 
        [patientData.name, patientData.ssn, patientData['contact-no'], patientData.bloodType, patientData.gender, patientData.password]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }
}
