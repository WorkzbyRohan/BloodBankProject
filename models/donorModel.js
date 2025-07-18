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

  static async updateNotificationStatus(did, status) {
    try {
      const [result] = await db.execute(
        'UPDATE have_request SET status = ? WHERE did = ?',
        [status, did]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }

  static async setOtherDonorsUnable(rid, acceptedDonorSSN) {
    try {
      const [result] = await db.execute(
        "UPDATE have_request SET status = 'Already accepted by another donor' WHERE rid = ? AND d_SSN != ? AND status = 'Pending'",
        [rid, acceptedDonorSSN]
      );
      return result.affectedRows;
    } catch (err) {
      throw err;
    }
  }

  static async setOtherDonorsPending(rid, rejectedDonorSSN) {
    try {
      const [result] = await db.execute(
        "UPDATE have_request SET status = 'Pending' WHERE rid = ? AND d_SSN != ? AND status = 'Already accepted by another donor'",
        [rid, rejectedDonorSSN]
      );
      return result.affectedRows;
    } catch (err) {
      throw err;
    }
  }

  static async setRequestPending(rid) {
    try {
      const [result] = await db.execute(
        "UPDATE make_request SET Status = 'Pending' WHERE rid = ?",
        [rid]
      );
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }

  static async getNotificationById(did) {
    try {
      const [rows] = await db.execute('SELECT * FROM have_request WHERE did = ?', [did]);
      return rows[0] || null;
    } catch (err) {
      throw err;
    }
  }

  static async setRequestCompleted(rid) {
    try {
      console.log('Updating make_request rid:', rid, 'to Fulfilled');
      const [result] = await db.execute(
        "UPDATE make_request SET Status = 'Fulfilled' WHERE rid = ? AND Status = 'Pending'",
        [rid]
      );
      console.log('Rows affected in make_request:', result.affectedRows);
      return result.affectedRows > 0;
    } catch (err) {
      throw err;
    }
  }

  static async countCompletedDonations(ssn) {
    try {
      const [rows] = await db.execute(
        "SELECT COUNT(*) as count FROM have_request WHERE d_SSN = ? AND status = 'Completed'",
        [ssn]
      );
      return rows[0].count;
    } catch (err) {
      throw err;
    }
  }
}