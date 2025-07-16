const db = require("../utils/databaseUtil");

module.exports = class Donor {
  static async checkLogin(name, password) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM donor WHERE Name = ? AND password = ?',
        [name, password]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      throw err;
    }
  }

  static async create(donorData) {
    try {
      const [result] = await db.execute(
        'INSERT INTO donor (Name, SSN, `contact-no`, `blood group`, Gender, password) VALUES (?, ?, ?, ?, ?, ?)',
        [donorData.name, donorData.ssn, donorData['contact-no'], donorData.bloodType, donorData.gender, donorData.password]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }
}