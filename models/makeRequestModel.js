const db = require("../utils/databaseUtil");

module.exports = class MakeRequest {
  static async create(requestData) {
    try {
      const [result] = await db.execute(
        'INSERT INTO make_request (Name, SSN, `Contact-No`, BloodType, Hospital, Date, Quantity, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          requestData.Name,
          requestData.SSN,
          requestData['Contact-No'],
          requestData.BloodType,
          requestData.Hospital,
          requestData.Date,
          requestData.Quantity,
          'Pending' // Status is always Pending initially
        ]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }

  static async getBySSN(ssn) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM make_request WHERE SSN = ? ORDER BY Date DESC',
        [ssn]
      );
      return rows;
    } catch (err) {
      throw err;
    }
  }

  static async countBySSN(ssn) {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM make_request WHERE SSN = ?', [ssn]);
      return rows[0].count;
    } catch (err) {
      throw err;
    }
  }

  static async countBySSNAndStatus(ssn, status) {
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM make_request WHERE SSN = ? AND Status = ?', [ssn, status]);
      return rows[0].count;
    } catch (err) {
      throw err;
    }
  }

  static async getDonorsByBloodGroup(bloodGroup) {
    try {
      const [rows] = await db.execute('SELECT SSN FROM donor WHERE `blood group` = ?', [bloodGroup]);
      return rows;
    } catch (err) {
      throw err;
    }
  }

  static async getLatestRequestBySSN(ssn) {
    try {
      const [rows] = await db.execute('SELECT * FROM make_request WHERE SSN = ? ORDER BY Date DESC, rid DESC LIMIT 1', [ssn]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  }

  static async createNotification(donorSSN, rid, message) {
    try {
      const [result] = await db.execute(
        'INSERT INTO have_request (d_SSN, rid, message, status) VALUES (?, ?, ?, ?)',
        [donorSSN, rid, message, 'Pending']
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }
} 