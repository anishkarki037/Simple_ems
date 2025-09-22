import express from "express";
import { db } from "../db.js";
import { verifyToken, isEmployee } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import moment from "moment-timezone";
const router = express.Router();

//  PROFILE 
router.get("/profile", verifyToken, isEmployee, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.*, d.name as department, p.name as position 
       FROM users u 
       LEFT JOIN departments d ON u.department_id=d.id 
       LEFT JOIN positions p ON u.position_id=p.id 
       WHERE u.id=?`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch profile" });
  }
});

router.put("/profile", verifyToken, isEmployee, async (req, res) => {
  const { name, phone, photo } = req.body;
  try {
    await db.query(
      "UPDATE users SET name=?, phone=?, photo=? WHERE id=?",
      [name, phone, photo, req.user.id]
    );
    res.json({ msg: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to update profile" });
  }
});

//  LEAVES 
router.get("/leaves", verifyToken, isEmployee, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM leaves WHERE user_id=? ORDER BY start_date DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch leaves" });
  }
});

router.post("/leaves", verifyToken, isEmployee, async (req, res) => {
  const { start_date, end_date, reason } = req.body;
  try {
    await db.query(
      "INSERT INTO leaves(user_id,start_date,end_date,reason) VALUES(?,?,?,?)",
      [req.user.id, start_date, end_date, reason]
    );
    res.json({ msg: "Leave applied" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to apply leave" });
  }
});

//  SALARY 
router.get("/salaries", verifyToken, isEmployee, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM salaries WHERE user_id=?", [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch salaries" });
  }
});

//  ATTENDANCE 
router.get("/my-attendance", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      `SELECT id, date, check_in, check_out,
        CASE WHEN check_in IS NOT NULL THEN 'present' ELSE 'absent' END AS status
       FROM attendance
       WHERE user_id = ?
       ORDER BY date DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch attendance" });
  }
});


router.post("/checkin", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's date in Nepal timezone
    const today = moment().tz("Asia/Kathmandu").format("YYYY-MM-DD");
    const checkInTime = moment().tz("Asia/Kathmandu").format("HH:mm:ss");

    // Check if attendance exists for today
    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE user_id=? AND date=?",
      [userId, today]
    );

    if (rows.length > 0 && rows[0].check_in) {
      return res.status(400).json({ msg: "Already checked in today" });
    }

    if (rows.length > 0) {
      // Update existing record
      await db.query("UPDATE attendance SET check_in=? WHERE id=?", [
        checkInTime,
        rows[0].id,
      ]);
    } else {
      // Insert new record
      await db.query(
        "INSERT INTO attendance(user_id, date, check_in) VALUES(?,?,?)",
        [userId, today, checkInTime]
      );
    }

    res.json({ msg: "Checked in successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to check in" });
  }
});

router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = moment().tz("Asia/Kathmandu").format("YYYY-MM-DD");
    const checkOutTime = moment().tz("Asia/Kathmandu").format("HH:mm:ss");

    const [rows] = await db.query(
      "SELECT * FROM attendance WHERE user_id=? AND date=?",
      [userId, today]
    );

    if (rows.length === 0 || !rows[0].check_in) {
      return res.status(400).json({ msg: "You need to check in first" });
    }
    if (rows[0].check_out) {
      return res.status(400).json({ msg: "Already checked out today" });
    }

    await db.query("UPDATE attendance SET check_out=? WHERE id=?", [
      checkOutTime,
      rows[0].id,
    ]);

    res.json({ msg: "Checked out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to check out" });
  }
});


router.get("/today-attendance", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const [rows] = await db.query("SELECT check_in, check_out FROM attendance WHERE user_id=? AND date=?", [userId, today]);
    if (rows.length === 0) return res.json({ checkedIn: false, checkedOut: false });
    const record = rows[0];
    res.json({ checkedIn: !!record.check_in, checkedOut: !!record.check_out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch today's attendance" });
  }
});

//  DASHBOARD 
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ Present Days
    const [attendanceRows] = await db.query(
      "SELECT * FROM attendance WHERE user_id=? AND check_in IS NOT NULL",
      [userId]
    );
    const presentDays = attendanceRows.length;

    // ✅ Leaves Taken
    const [leavesRows] = await db.query(
      "SELECT * FROM leaves WHERE user_id=?",
      [userId]
    );
    const leavesTaken = leavesRows.length;

    // ✅ Salary Status (latest)
    const [latestSalary] = await db.query(
      "SELECT status FROM salaries WHERE user_id=? ORDER BY id DESC LIMIT 1",
      [userId]
    );
    const salaryStatus =
      latestSalary.length > 0 ? latestSalary[0].status : "unpaid";

    // ✅ Salary Breakdown (last 3 months)
    const [salaryBreakdown] = await db.query(
      `SELECT month, year, basic, bonus, deductions, status 
       FROM salaries 
       WHERE user_id=? 
       ORDER BY year DESC, 
                STR_TO_DATE(CONCAT('01-', month, '-', year), '%d-%M-%Y') DESC 
       LIMIT 3`,
      [userId]
    );

    // ✅ Attendance Trend (last 7 days, Nepali time)
    const [trendRows] = await db.query(
      "SELECT date, check_in, check_out FROM attendance WHERE user_id=? ORDER BY date DESC LIMIT 7",
      [userId]
    );

    const attendanceTrend = trendRows
      .map((row) => ({
        date: moment(row.date).tz("Asia/Kathmandu").format("YYYY-MM-DD"),
        check_in: row.check_in
          ? moment(row.check_in, "HH:mm:ss")
              .tz("Asia/Kathmandu")
              .format("HH:mm")
          : null,
        check_out: row.check_out
          ? moment(row.check_out, "HH:mm:ss")
              .tz("Asia/Kathmandu")
              .format("HH:mm")
          : null,
      }))
      .reverse();

    // ✅ Today’s Status
    const today = moment().tz("Asia/Kathmandu").format("YYYY-MM-DD");
    const [todayRows] = await db.query(
      "SELECT check_in, check_out FROM attendance WHERE user_id=? AND date=?",
      [userId, today]
    );

    const todayStatus =
      todayRows.length === 0
        ? { checkedIn: false, checkedOut: false }
        : {
            checkedIn: !!todayRows[0].check_in,
            checkedOut: !!todayRows[0].check_out,
          };

    res.json({
      presentDays,
      leavesTaken,
      salaryStatus,
      salaryBreakdown,
      attendanceTrend,
      todayStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to fetch dashboard data" });
  }
});




//  RESET PASSWORD 
router.put("/reset-password", verifyToken, isEmployee, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password) return res.status(400).json({ msg: "New password is required" });

  try {
    const [users] = await db.query("SELECT password FROM users WHERE id=?", [req.user.id]);
    if (users.length === 0) return res.status(404).json({ msg: "User not found" });

    const user = users[0];

    // Verify current password if provided
    if (current_password) {
      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    await db.query("UPDATE users SET password=? WHERE id=?", [hashedPassword, req.user.id]);

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to reset password" });
  }
});

export default router;
