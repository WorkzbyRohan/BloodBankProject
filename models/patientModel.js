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
}
