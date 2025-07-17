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

  static async getNotificationsBySSN(ssn, limit) {
    try {
      let sql = "SELECT hr.*, mr.Name as patientName, mr.`Contact-No` as patientContact FROM have_request hr JOIN make_request mr ON hr.rid = mr.rid WHERE hr.d_SSN = ? ORDER BY hr.did DESC";
      const params = [ssn];
      if (limit) {
        sql += " LIMIT " + Number(limit);
      }
      const [rows] = await db.execute(sql, params);
      return rows;
    } catch (err) {
      throw err;
    }
  }

  static async getTrackRecordsBySSN(ssn) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM track_record WHERE SSN = ? ORDER BY Date DESC',
        [ssn]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  }

  static async getTrackRecordsFromHaveRequest(ssn) {
    try {
      const [rows] = await db.execute(
        "SELECT hr.*, mr.Hospital, mr.Date FROM have_request hr JOIN make_request mr ON hr.rid = mr.rid WHERE hr.d_SSN = ? AND (hr.status = 'Completed' OR hr.status = 'Rejected') ORDER BY hr.did DESC",
        [ssn]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  }
}