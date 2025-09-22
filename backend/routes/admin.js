import express from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();
const calculateDeductions = (salary) => {
  let remaining = salary;
  let deduction = 0;

  // Band 1: First 500,000 at 1%
  const band1 = Math.min(remaining, 500000);
  deduction += band1 * 0.01;
  remaining -= band1;

  if (remaining <= 0) return deduction;

  // Band 2: Next 200,000 at 10%
  const band2 = Math.min(remaining, 200000);
  deduction += band2 * 0.10;
  remaining -= band2;

  if (remaining <= 0) return deduction;

  // Band 3: Next 300,000 at 20%
  const band3 = Math.min(remaining, 300000);
  deduction += band3 * 0.20;
  remaining -= band3;

  if (remaining <= 0) return deduction;

  // Band 4: Next 1,000,000 at 30%
  const band4 = Math.min(remaining, 1000000);
  deduction += band4 * 0.30;

  return deduction;
};

// --- Departments CRUD ---
router.get("/departments", verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM departments ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ msg: "Failed to fetch departments" });
  }
});

router.post("/departments", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ msg: "Department name is required" });
    }
    await db.query("INSERT INTO departments(name) VALUES(?)", [name]);
    res.json({ msg: "Department added" });
  } catch (err) {
    console.error("Error adding department:", err);
    res.status(500).json({ msg: "Failed to add department" });
  }
});

router.delete("/departments/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM departments WHERE id=?", [id]);
    res.json({ msg: "Department deleted" });
  } catch (err) {
    console.error("Error deleting department:", err);
    res.status(500).json({ msg: "Failed to delete department" });
  }
});

// --- Positions CRUD ---
router.get("/positions", verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM positions ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching positions:", err);
    res.status(500).json({ msg: "Failed to fetch positions" });
  }
});

router.post("/positions", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ msg: "Position name is required" });
    }
    await db.query("INSERT INTO positions(name) VALUES(?)", [name]);
    res.json({ msg: "Position added" });
  } catch (err) {
    console.error("Error adding position:", err);
    res.status(500).json({ msg: "Failed to add position" });
  }
});

router.delete("/positions/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM positions WHERE id=?", [id]);
    res.json({ msg: "Position deleted" });
  } catch (err) {
    console.error("Error deleting position:", err);
    res.status(500).json({ msg: "Failed to delete position" });
  }
});

// --- Employees CRUD ---
router.get("/employees", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("Attempting to fetch employees...");
    
    const [users] = await db.query("SELECT * FROM users WHERE role = 'employee'");
    console.log("Found users:", users.length);
    
    if (users.length > 0) {
      const [rows] = await db.query(
        `SELECT u.id, u.name, u.email, u.department_id, u.position_id, u.phone, u.photo, u.salary,
                d.name as department_name, d.name as department, 
                p.name as position_name, p.name as position 
         FROM users u 
         LEFT JOIN departments d ON u.department_id = d.id 
         LEFT JOIN positions p ON u.position_id = p.id 
         WHERE u.role = 'employee'
         ORDER BY u.name`
      );
      console.log("Successfully fetched employees with joins:", rows.length);
      res.json(rows);
    } else {
      
      console.log("No employees found");
      res.json([]);
    }
  } catch (err) {
    console.error("Detailed error fetching employees:", err);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Error stack:", err.stack);
    

    try {
      console.log("Trying fallback query...");
      const [fallbackRows] = await db.query("SELECT id, name, email, role FROM users WHERE role = 'employee'");
      console.log("Fallback query successful:", fallbackRows.length);
      res.json(fallbackRows.map(row => ({
        ...row,
        department: 'Unknown',
        position: 'Unknown',
        salary: 0
      })));
    } catch (fallbackErr) {
      console.error("Fallback query also failed:", fallbackErr);
      res.status(500).json({ 
        msg: "Failed to fetch employees", 
        error: err.message,
        details: "Check server logs for more information"
      });
    }
  }
});

router.post("/employees", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, department_id, position_id, phone, photo, salary } = req.body;
    
    // Validation
    if (!name || !email || !password || !department_id || !position_id) {
      return res.status(400).json({ msg: "Please provide all required fields (name, email, password, department, position)" });
    }

    // Check if email already exists
    const [existingUser] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Insert employee
    await db.query(
      `INSERT INTO users(name, email, password, role, department_id, position_id, phone, photo, salary) 
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, "employee", department_id, position_id, phone || null, photo || null, salary || 0]
    );
    
    res.json({ msg: "Employee added successfully" });
  } catch (err) {
    console.error("Error adding employee:", err);
    res.status(500).json({ msg: "Failed to add employee" });
  }
});

// --- UPDATE Employee ---
router.put("/employees/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, department_id, position_id, phone, photo, salary } = req.body;

    // Basic validation
    if (!name || !email || !department_id || !position_id) {
      return res.status(400).json({ msg: "Please provide all required fields (name, email, department, position)" });
    }

    // Check if email already exists
    const [existingUser] = await db.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, id]);
    if (existingUser.length > 0) {
      return res.status(400).json({ msg: "Email already exists for another user" });
    }

    // Prepare update query
    let updateQuery = `UPDATE users 
                       SET name=?, email=?, department_id=?, position_id=?, phone=?, photo=?, salary=?`;
    let params = [name, email, department_id, position_id, phone || null, photo || null, salary || 0];

    // If password is provided, hash it and include in update
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      updateQuery += `, password=?`;
      params.push(hashed);
    }

    updateQuery += ` WHERE id=?`;
    params.push(id);

    await db.query(updateQuery, params);
    
    res.json({ msg: "Employee updated successfully" });
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ msg: "Failed to update employee" });
  }
});

router.delete("/employees/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const [employee] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'employee'", [id]);
    if (employee.length === 0) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    // Check if salaries exist
    const [salaries] = await db.query("SELECT id FROM salaries WHERE user_id = ?", [id]);
    if (salaries.length > 0) {
      return res.status(400).json({ msg: "Cannot delete employee with existing salary records" });
    }

    // Check if leaves exist
    const [leaves] = await db.query("SELECT id FROM leaves WHERE user_id = ?", [id]);
    if (leaves.length > 0) {
      return res.status(400).json({ msg: "Cannot delete employee with existing leave records" });
    }

    // Check if attendance records exist
    const [attendance] = await db.query("SELECT id FROM attendance WHERE user_id = ?", [id]);
    if (attendance.length > 0) {
      return res.status(400).json({ msg: "Cannot delete employee with existing attendance records" });
    }

    // If no linked records, delete employee
    await db.query("DELETE FROM users WHERE id=?", [id]);
    res.json({ msg: "Employee deleted successfully" });
    
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ msg: "Failed to delete employee" });
  }
});

// --- Leaves CRUD ---
router.get("/leaves", verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, u.name 
       FROM leaves l 
       JOIN users u ON l.user_id = u.id 
       ORDER BY l.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    res.status(500).json({ msg: "Failed to fetch leaves" });
  }
});

router.put("/leaves/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    await db.query("UPDATE leaves SET status=? WHERE id=?", [status, id]);
    res.json({ msg: "Leave updated successfully" });
  } catch (err) {
    console.error("Error updating leave:", err);
    res.status(500).json({ msg: "Failed to update leave" });
  }
});

// --- Salaries CRUD ---
router.get("/salaries", verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.name as employee_name, u.email,
              d.name as department_name,
              p.name as position_name
       FROM salaries s 
       JOIN users u ON s.user_id = u.id 
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN positions p ON u.position_id = p.id
       WHERE u.role = 'employee'
       ORDER BY s.year DESC, s.month DESC, u.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching salaries:", err);
    res.status(500).json({ msg: "Failed to fetch salaries" });
  }
});

router.post("/salaries", verifyToken, isAdmin, async (req, res) => {
  try {
    const { user_id, month, year, bonus, status } = req.body;

    console.log("Individual salary creation:", { user_id, month, year, bonus, status });

    // Validation
    if (!user_id || !month || !year) {
      return res.status(400).json({ msg: "Please provide user_id, month, and year" });
    }

    // Fetch employee's base salary from users table
    const [employee] = await db.query(
      "SELECT id, salary FROM users WHERE id = ? AND role = 'employee'",
      [user_id]
    );

    if (employee.length === 0) {
      return res.status(400).json({ msg: "Employee not found" });
    }

    const basicSalary = parseFloat(employee[0].salary) || 0.00;

    // Check if salary record already exists for the employee in this month/year
    const [existingSalary] = await db.query(
      "SELECT id FROM salaries WHERE user_id = ? AND month = ? AND year = ?", 
      [user_id, month, year]
    );

    if (existingSalary.length > 0) {
      return res.status(400).json({ msg: "Salary record already exists for this employee in this period" });
    }

    // Calculate tax deductions automatically
    const deductions = calculateDeductions(basicSalary);

    console.log(`Calculated values: Basic=${basicSalary}, Bonus=${bonus}, Deductions=${deductions}`);

    // Insert salary record
    await db.query(
      `INSERT INTO salaries (user_id, month, year, basic, bonus, deductions, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        month,
        parseInt(year),
        basicSalary,
        parseFloat(bonus) || 0.00,
        deductions,
        status || 'unpaid'
      ]
    );

    res.json({ 
      msg: "Salary record added successfully", 
      basic: basicSalary,
      deductions: deductions
    });
  } catch (err) {
    console.error("Error adding salary:", err);
    res.status(500).json({ msg: "Failed to add salary record" });
  }
});
// --- Mark Multiple Salaries as Paid/Unpaid ---
router.put("/salaries/bulk-status", verifyToken, isAdmin, async (req, res) => {
    
  try {
    const { salary_ids, status } = req.body;
    
    if (!salary_ids || !Array.isArray(salary_ids) || salary_ids.length === 0) {
      return res.status(400).json({ msg: "Please provide salary IDs array" });
    }

    if (!['paid', 'unpaid'].includes(status)) {
      return res.status(400).json({ msg: "Invalid status. Must be 'paid' or 'unpaid'" });
    }

    const placeholders = salary_ids.map(() => '?').join(',');
    const params = [...salary_ids, status];
    
    const [result] = await db.query(
      `UPDATE salaries SET status = ? WHERE id IN (${placeholders})`,
      [status, ...salary_ids]
    );

    res.json({ 
      msg: `Successfully updated ${result.affectedRows} salary records to ${status}`,
      updated: result.affectedRows
    });
  } catch (err) {
    console.error("Error bulk updating salary status:", err);
    res.status(500).json({ msg: "Failed to bulk update salary status" });
  }
});

router.put("/salaries/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, month, year, basic, bonus, status } = req.body;
    
    console.log("Updating salary:", { id, user_id, month, year, basic, bonus, status });
    
    // Check if salary record exists
    const [existingSalary] = await db.query("SELECT id FROM salaries WHERE id = ?", [id]);
    if (existingSalary.length === 0) {
      return res.status(404).json({ msg: "Salary record not found" });
    }

    // If updating user_id, month, or year, check for duplicates
    if (user_id || month || year) {
      const [duplicate] = await db.query(
        "SELECT id FROM salaries WHERE user_id = ? AND month = ? AND year = ? AND id != ?",
        [user_id, month, year, id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ msg: "Salary record already exists for this employee in this period" });
      }
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    
    if (user_id) {
      updates.push("user_id = ?");
      params.push(user_id);
    }
    if (month) {
      updates.push("month = ?");
      params.push(month);
    }
    if (year) {
      updates.push("year = ?");
      params.push(parseInt(year));
    }
    if (basic !== undefined) {
      const basicSalary = parseFloat(basic) || 0.00;
      updates.push("basic = ?");
      params.push(basicSalary);
      
      // Recalculate deductions when basic salary changes
      const deductions = calculateDeductions(basicSalary);
      updates.push("deductions = ?");
      params.push(deductions);
    }
    if (bonus !== undefined) {
      updates.push("bonus = ?");
      params.push(parseFloat(bonus) || 0.00);
    }
    if (status) {
      if (!['paid', 'unpaid'].includes(status)) {
        return res.status(400).json({ msg: "Invalid status. Must be 'paid' or 'unpaid'" });
      }
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ msg: "No fields to update" });
    }

    params.push(id);
    
    await db.query(
      `UPDATE salaries SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
    
    res.json({ msg: "Salary record updated successfully" });
  } catch (err) {
    console.error("Error updating salary:", err);
    res.status(500).json({ msg: "Failed to update salary record" });
  }
});

router.delete("/salaries/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if salary record exists
    const [salary] = await db.query("SELECT id FROM salaries WHERE id = ?", [id]);
    if (salary.length === 0) {
      return res.status(404).json({ msg: "Salary record not found" });
    }

    await db.query("DELETE FROM salaries WHERE id = ?", [id]);
    res.json({ msg: "Salary record deleted successfully" });
  } catch (err) {
    console.error("Error deleting salary:", err);
    res.status(500).json({ msg: "Failed to delete salary record" });
  }
});

// --- Bulk Salary Generation ---
router.post("/salaries/bulk-generate", verifyToken, isAdmin, async (req, res) => {
  try {
    const { month, year, bonusPercentage } = req.body;

    console.log("Bulk generate request:", { month, year, bonusPercentage });

    if (!month || !year) {
      return res.status(400).json({ msg: "Please provide month and year" });
    }

    // Fetch all employees with their base salaries
    const [employees] = await db.query(
      "SELECT id, name, salary FROM users WHERE role = 'employee'"
    );

    console.log("Found employees:", employees.length);

    if (employees.length === 0) {
      return res.status(400).json({ msg: "No employees found" });
    }

    // Check for existing salaries for this month/year
    const [existingSalaries] = await db.query(
      "SELECT user_id FROM salaries WHERE month = ? AND year = ?",
      [month, year]
    );

    const existingUserIds = existingSalaries.map(s => s.user_id);
    const newEmployees = employees.filter(emp => !existingUserIds.includes(emp.id));

    console.log("New employees to generate:", newEmployees.length);

    if (newEmployees.length === 0) {
      return res.status(400).json({ msg: "Salary records already exist for all employees in this period" });
    }

    // Calculate salary components for each employee
    const values = newEmployees.map(emp => {
      const basic = parseFloat(emp.salary) || 0.00;
      
      // Calculate bonus from percentage if provided
      const bonusAmount = bonusPercentage ? (basic * parseFloat(bonusPercentage) / 100) : 0.00;
      
      // Calculate tax deductions using the progressive tax system
      const deductionAmount = calculateDeductions(basic);

      console.log(`Employee ${emp.name}: Basic=${basic}, Bonus=${bonusAmount}, Deductions=${deductionAmount}`);

      return [
        emp.id,
        month,
        parseInt(year),
        basic,
        bonusAmount,
        deductionAmount,
        'unpaid'
      ];
    });

    // Insert bulk salary records
    const insertQuery = `
      INSERT INTO salaries (user_id, month, year, basic, bonus, deductions, status) 
      VALUES ?
    `;
    
    await db.query(insertQuery, [values]);

    console.log("Successfully generated salary records");

    res.json({
      msg: `Generated ${newEmployees.length} salary records for ${month}/${year}`,
      generated: newEmployees.length,
      skipped: existingUserIds.length,
      details: newEmployees.map(emp => ({
        name: emp.name,
        basic: parseFloat(emp.salary) || 0,
        bonus: bonusPercentage ? ((parseFloat(emp.salary) || 0) * parseFloat(bonusPercentage) / 100) : 0,
        deductions: calculateDeductions(parseFloat(emp.salary) || 0)
      }))
    });
  } catch (err) {
    console.error("Error generating bulk salaries:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      msg: "Failed to generate bulk salary records",
      error: err.message,
      details: err.stack
    });
  }
});


// --- Salary Statistics ---
router.get("/salaries/stats", verifyToken, isAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let whereClause = "";
    let params = [];
    
    if (month && year) {
      whereClause = "WHERE s.month = ? AND s.year = ?";
      params = [month, parseInt(year)];
    }

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN s.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN s.status = 'unpaid' THEN 1 END) as unpaid_count,
        COALESCE(SUM(s.basic + COALESCE(s.bonus, 0) - COALESCE(s.deductions, 0)), 0) as total_amount,
        COALESCE(SUM(CASE WHEN s.status = 'paid' THEN s.basic + COALESCE(s.bonus, 0) - COALESCE(s.deductions, 0) ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN s.status = 'unpaid' THEN s.basic + COALESCE(s.bonus, 0) - COALESCE(s.deductions, 0) ELSE 0 END), 0) as unpaid_amount
      FROM salaries s
      JOIN users u ON s.user_id = u.id
      ${whereClause}
    `, params);

    res.json(stats[0] || {
      total_records: 0,
      paid_count: 0,
      unpaid_count: 0,
      total_amount: 0,
      paid_amount: 0,
      unpaid_amount: 0
    });
  } catch (err) {
    console.error("Error fetching salary stats:", err);
    res.status(500).json({ msg: "Failed to fetch salary statistics" });
  }
});

// --- Payslip Generation ---
router.get("/salaries/:id/payslip", verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [payslip] = await db.query(
      `SELECT s.*, u.name as employee_name, u.email, u.phone,
              d.name as department_name,
              p.name as position_name,
              (s.basic + COALESCE(s.bonus, 0) - COALESCE(s.deductions, 0)) as net_salary
       FROM salaries s 
       JOIN users u ON s.user_id = u.id 
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN positions p ON u.position_id = p.id
       WHERE s.id = ?`, 
      [id]
    );

    if (payslip.length === 0) {
      return res.status(404).json({ msg: "Salary record not found" });
    }

    res.json(payslip[0]);
  } catch (err) {
    console.error("Error fetching payslip:", err);
    res.status(500).json({ msg: "Failed to fetch payslip" });
  }
});



// --- Attendance ---
router.get("/attendance", verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.date, a.check_in, a.check_out, u.name,
              CASE 
                WHEN a.check_in IS NOT NULL THEN 'present'
                ELSE 'absent'
              END AS status
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       ORDER BY a.date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ msg: "Failed to fetch attendance" });
  }
});

router.put("/attendance/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    await db.query("UPDATE attendance SET status=? WHERE id=?", [status, id]);
    res.json({ msg: "Attendance updated successfully" });
  } catch (err) {
    console.error("Error updating attendance:", err);
    res.status(500).json({ msg: "Failed to update attendance" });
  }
});

// --- DEBUG ENDPOINT - Test database connection ---
router.get("/test-db", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("Testing database connection...");
    
    // Test basic connection
    const [result] = await db.query("SELECT 1 as test");
    console.log("Basic query successful:", result);
    
    // Test tables exist
    const [tables] = await db.query("SHOW TABLES");
    console.log("Tables found:", tables);
    
    // Test users table structure
    const [userColumns] = await db.query("DESCRIBE users");
    console.log("Users table structure:", userColumns);
    
    // Test count of users
    const [userCount] = await db.query("SELECT COUNT(*) as count, role FROM users GROUP BY role");
    console.log("User counts by role:", userCount);
    
    // Test departments
    const [deptCount] = await db.query("SELECT COUNT(*) as count FROM departments");
    console.log("Department count:", deptCount);
    
    // Test positions
    const [posCount] = await db.query("SELECT COUNT(*) as count FROM positions");
    console.log("Position count:", posCount);
    
    res.json({
      status: "Database connection successful",
      tables: tables,
      userCounts: userCount,
      departmentCount: deptCount[0]?.count || 0,
      positionCount: posCount[0]?.count || 0
    });
  } catch (err) {
    console.error("Database test failed:", err);
    res.status(500).json({
      status: "Database test failed",
      error: err.message,
      code: err.code
    });
  }
});

export default router;