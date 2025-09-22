import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

const API_URL = "http://localhost:5000/api/admin";
import { jsPDF } from "jspdf";

export default function Salaries() {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [payslipModal, setPayslipModal] = useState(false);
  const [bulkGenerateModal, setBulkGenerateModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [form, setForm] = useState({
    user_id: "",
    month: "",
    year: new Date().getFullYear(),
    basic: "",
    bonus: "0",
    bonusPercentage: "0",
    deductions: "0",
    status: "unpaid",
  });
  const [bulkForm, setBulkForm] = useState({
    month: "",
    year: new Date().getFullYear(),
    includeBonuses: false,
    bonusPercentage: "0",
  });
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [stats, setStats] = useState({
    total_records: 0,
    paid_count: 0,
    unpaid_count: 0,
    total_amount: 0,
    paid_amount: 0,
    unpaid_amount: 0,
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // --- DATA FETCHING ---
  const fetchSalaries = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/salaries`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch salaries");
      const data = await response.json();
      setSalaries(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/employees`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams({ month: filterMonth, year: filterYear }).toString();
      const response = await fetch(`${API_URL}/salaries/stats?${query}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();

      // Convert string values from API to numbers before setting state
      const numericStats = {
        ...data,
        total_amount: parseFloat(data.total_amount) || 0,
        paid_amount: parseFloat(data.paid_amount) || 0,
        unpaid_amount: parseFloat(data.unpaid_amount) || 0,
      };

      setStats(numericStats);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchSalaries();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filterMonth, filterYear, salaries]); // Re-fetch stats if salaries change

  // --- TAX DEDUCTION CALCULATION ---
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

  // --- FORM HANDLING ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    // When employee is selected, fetch their base salary and calculate deductions
    if (name === "user_id" && value) {
      const selectedEmployee = employees.find(emp => emp.id.toString() === value);
      if (selectedEmployee) {
        const baseSalary = parseFloat(selectedEmployee.salary) || 0;
        const deductions = calculateDeductions(baseSalary);
        
        updatedForm.basic = baseSalary.toString();
        updatedForm.deductions = deductions.toFixed(2);
      }
    }

    // If basic salary changes manually, recalculate deductions
    if (name === "basic") {
      const basicSalary = parseFloat(value) || 0;
      updatedForm.deductions = calculateDeductions(basicSalary).toFixed(2);
    }

    // Convert bonus percentage to amount
    if (name === "bonusPercentage") {
      const basicSalary = parseFloat(updatedForm.basic) || 0;
      const bonusPercentage = parseFloat(value) || 0;
      updatedForm.bonus = (basicSalary * bonusPercentage / 100).toFixed(2);
    }

    setForm(updatedForm);
  };

  const handleBulkFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBulkForm({ 
      ...bulkForm, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const resetForm = () => {
    setForm({
      user_id: "",
      month: "",
      year: new Date().getFullYear(),
      basic: "",
      bonus: "0",
      bonusPercentage: "0",
      deductions: "0",
      status: "unpaid",
    });
    setEditingId(null);
  };

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_URL}/salaries/${editingId}` : `${API_URL}/salaries`;
      const method = editingId ? "PUT" : "POST";

      const basicSalary = parseFloat(form.basic) || 0;
      const bonus = parseFloat(form.bonus) || 0;
      const deductions = calculateDeductions(basicSalary);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          user_id: form.user_id,
          month: form.month,
          year: form.year,
          basic: basicSalary,
          bonus: bonus,
          deductions: deductions,
          status: form.status,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || "Failed to save salary");

      toast.success(editingId ? "Salary updated!" : "Salary added!");
      resetForm();
      setModalOpen(false);
      fetchSalaries();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (salary) => {
    const employee = employees.find(emp => emp.id === salary.user_id);
    const baseSalary = parseFloat(employee?.salary || salary.basic);
    const bonusAmount = parseFloat(salary.bonus) || 0;
    const bonusPercentage = baseSalary > 0 ? ((bonusAmount / baseSalary) * 100).toFixed(2) : "0";

    setForm({
      user_id: salary.user_id,
      month: salary.month,
      year: salary.year,
      basic: salary.basic || "",
      bonus: salary.bonus || "0",
      bonusPercentage: bonusPercentage,
      deductions: salary.deductions || "0",
      status: salary.status,
    });
    setEditingId(salary.id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salary record?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/salaries/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to delete salary");
      toast.success("Salary record deleted");
      fetchSalaries();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // --- FEATURE FUNCTIONS ---
  const generatePayslip = async (salaryId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/salaries/${salaryId}/payslip`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || "Failed to fetch payslip data");
      setSelectedPayslip(result);
      setPayslipModal(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const downloadPayslip = () => {
  if (!selectedPayslip) return;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text("EMS by Aayush Nepal", 105, 20, null, null, "center");
  doc.setFontSize(14);
  doc.text("Payslip", 105, 30, null, null, "center");
  doc.line(20, 35, 190, 35); // horizontal line

  // Employee info
  doc.setFontSize(11);
  doc.text(`Employee: ${selectedPayslip.employee_name}`, 20, 45);
  doc.text(`Department: ${selectedPayslip.department_name}`, 20, 52);
  doc.text(`Position: ${selectedPayslip.position_name}`, 20, 59);
  doc.text(`Period: ${selectedPayslip.month} ${selectedPayslip.year}`, 140, 45);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 140, 52);
  doc.text(`Status: ${selectedPayslip.status.toUpperCase()}`, 140, 59);

  // Earnings & Deductions
  const startY = 75;
  const rowHeight = 8;
  let currentY = startY;

  doc.setFontSize(12);
  doc.text("Earnings / Deductions", 20, currentY);
  doc.text("Amount (Rs.)", 150, currentY);
  doc.line(20, currentY + 2, 190, currentY + 2);

  currentY += rowHeight;

  const rows = [
    { label: "Basic Salary", value: parseFloat(selectedPayslip.basic) || 0 },
    { label: "Bonus", value: parseFloat(selectedPayslip.bonus) || 0 },
    { label: "Tax Deductions", value: parseFloat(selectedPayslip.deductions) || 0 },
  ];

  rows.forEach(row => {
    doc.text(row.label, 20, currentY);
    doc.text(row.value.toFixed(2), 150, currentY, { align: "right" });
    currentY += rowHeight;
  });

  doc.line(20, currentY, 190, currentY); // line above total
  currentY += 5;

  const netSalary = (parseFloat(selectedPayslip.basic) || 0) 
                    + (parseFloat(selectedPayslip.bonus) || 0)
                    - (parseFloat(selectedPayslip.deductions) || 0);

  doc.setFontSize(13);
  doc.text("Net Salary", 20, currentY);
  doc.text(netSalary.toFixed(2), 150, currentY, { align: "right" });

  // Footer
  currentY += 15;
  doc.setFontSize(10);
  doc.text(
    "This is a computer-generated payslip and does not require a signature.",
    105,
    currentY,
    null,
    null,
    "center"
  );

  doc.save(`Payslip_${selectedPayslip.employee_name}_${selectedPayslip.month}_${selectedPayslip.year}.pdf`);
  toast.success("Payslip downloaded as PDF!");
};

  const handleBulkGenerateSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const requestBody = {
        month: bulkForm.month,
        year: bulkForm.year,
      };

      // Add bonus percentage if bonuses are included
      if (bulkForm.includeBonuses) {
        requestBody.bonusPercentage = parseFloat(bulkForm.bonusPercentage) || 0;
      }

      const response = await fetch(`${API_URL}/salaries/bulk-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || "Failed to generate salaries");
      
      toast.success(result.msg);
      setBulkGenerateModal(false);
      setBulkForm({
        month: "",
        year: new Date().getFullYear(),
        includeBonuses: false,
        bonusPercentage: "0",
      });
      fetchSalaries();
    } catch (error) {
      toast.error(error.message);
    }
  };

const handleBulkStatusUpdate = async (status) => {
  if (selectedIds.length === 0) return toast.info("Select records first");
  if (!window.confirm(`Mark ${selectedIds.length} records as ${status}?`)) return;

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/salaries/bulk-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ salary_ids: selectedIds, status })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.msg || "Failed to update");
    
    toast.success(result.msg);
    fetchSalaries(); // refresh
    setSelectedIds([]);
  } catch (error) {
    console.error("Bulk update error:", error);
    toast.error(error.message);
  }
};



  // --- SELECTION & FILTERING ---
  const filtered = salaries.filter(s => {
    const matchesSearch = s.employee_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const matchesMonth = !filterMonth || s.month === filterMonth;
    const matchesYear = !filterYear || s.year.toString() === filterYear;
    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };
  
  return (
    <div className="p-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Salary Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Salary
          </button>
          <button
            onClick={() => setBulkGenerateModal(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Generate Monthly Salaries
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <input type="text" placeholder="Search by employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2 rounded" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-2 rounded">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border p-2 rounded">
          <option value="">All Months</option>
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        <input type="number" placeholder="Year" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border p-2 rounded" />
        <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterMonth(""); setFilterYear(""); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Clear Filters
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded"><h3 className="font-semibold">Total Records</h3><p className="text-2xl font-bold">{stats.total_records}</p></div>
        <div className="bg-green-100 p-4 rounded"><h3 className="font-semibold">Paid</h3><p className="text-2xl font-bold">{stats.paid_count}</p></div>
        <div className="bg-red-100 p-4 rounded"><h3 className="font-semibold">Unpaid</h3><p className="text-2xl font-bold">{stats.unpaid_count}</p></div>
        <div className="bg-purple-100 p-4 rounded"><h3 className="font-semibold">Total Amount Paid</h3><p className="text-2xl font-bold">Rs. {stats.paid_amount.toFixed(2)}</p></div>
      </div>
      
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center space-x-4 mb-4 bg-gray-100 p-2 rounded">
            <span className="font-semibold">{selectedIds.length} selected</span>
            <button onClick={() => handleBulkStatusUpdate('paid')} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Mark Paid</button>
            <button onClick={() => handleBulkStatusUpdate('unpaid')} className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600">Mark Unpaid</button>
        </div>
      )}

      {/* Salaries Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 w-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === filtered.length && filtered.length > 0} /></th>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Period</th>
              <th className="p-3 text-left">Basic Salary</th>
              <th className="p-3 text-left">Bonus</th>
              <th className="p-3 text-left">Tax Deductions</th>
              <th className="p-3 text-left">Net Salary</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(salary => {
              const basicSalary = parseFloat(salary.basic) || 0;
              const bonus = parseFloat(salary.bonus) || 0;
              const deductions = parseFloat(salary.deductions) || 0;
              const netSalary = basicSalary + bonus - deductions;
              
              return (
                <tr key={salary.id} className="border-b hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.includes(salary.id)} onChange={() => handleSelectOne(salary.id)} /></td>
                  <td className="p-3">{salary.employee_name}</td>
                  <td className="p-3">{salary.month} {salary.year}</td>
                  <td className="p-3">Rs. {basicSalary.toFixed(2)}</td>
                  <td className="p-3">Rs. {bonus.toFixed(2)}</td>
                  <td className="p-3">Rs. {deductions.toFixed(2)}</td>
                  <td className="p-3 font-semibold">Rs. {netSalary.toFixed(2)}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${salary.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{salary.status?.toUpperCase()}</span></td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button onClick={() => generatePayslip(salary.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">Payslip</button>
                      <button onClick={() => handleEdit(salary)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600">Edit</button>
                      <button onClick={() => handleDelete(salary.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="9" className="text-center p-4 text-gray-500">No salary records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Salary" : "Add Salary"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select 
                name="user_id" 
                value={form.user_id} 
                onChange={handleChange} 
                className="border p-2 rounded w-full" 
                required 
                disabled={editingId}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - Base: Rs. {parseFloat(emp.salary || 0).toFixed(2)}
                  </option>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-2">
                <select name="month" value={form.month} onChange={handleChange} className="border p-2 rounded" required>
                  <option value="">Select Month</option>
                  {months.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
                <input type="number" name="year" placeholder="Year" value={form.year} onChange={handleChange} className="border p-2 rounded" required />
              </div>
              <label className="block text-sm font-medium">Basic Salary</label>
              <input 
                type="number" 
                name="basic" 
                placeholder="Basic Salary" 
                value={form.basic} 
                onChange={handleChange} 
                className="border p-2 rounded w-full" 
                step="0.01" 
                required 
                readOnly={!!form.user_id}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Bonus (in %)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    name="bonusPercentage" 
                    placeholder="Bonus %" 
                    value={form.bonusPercentage} 
                    onChange={handleChange} 
                    className="border p-2 rounded" 
                    step="0.01" 
                  />
                  <input 
                    type="number" 
                    name="bonus" 
                    placeholder="Bonus Amount" 
                    value={form.bonus} 
                    className="border p-2 rounded bg-gray-100" 
                    step="0.01" 
                    readOnly
                  />
                </div>
              </div>
              <label className="block text-sm font-medium">Deductions</label>
              <input 
                type="number" 
                name="deductions" 
                placeholder="Tax Deductions" 
                value={form.deductions} 
                className="border p-2 rounded w-full bg-gray-100" 
                step="0.01" 
                readOnly
              />
              
              <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded w-full">
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
              
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => { setModalOpen(false); resetForm(); }} 
                  className="px-4 py-2 rounded border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {bulkGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold mb-4">Generate Monthly Salaries</h2>
            <form onSubmit={handleBulkGenerateSubmit} className="space-y-4">
              <select 
                name="month" 
                value={bulkForm.month} 
                onChange={handleBulkFormChange} 
                className="border p-2 rounded w-full" 
                required
              >
                <option value="">Select Month</option>
                {months.map(month => <option key={month} value={month}>{month}</option>)}
              </select>
              
              <input 
                type="number" 
                name="year" 
                placeholder="Year" 
                value={bulkForm.year} 
                onChange={handleBulkFormChange} 
                className="border p-2 rounded w-full" 
                required 
              />
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    name="includeBonuses" 
                    checked={bulkForm.includeBonuses} 
                    onChange={handleBulkFormChange} 
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">Include Bonuses (in %)</label>
                </div>
                
                {bulkForm.includeBonuses && (
                  <input 
                    type="number" 
                    name="bonusPercentage" 
                    placeholder="Bonus Percentage %" 
                    value={bulkForm.bonusPercentage} 
                    onChange={handleBulkFormChange} 
                    className="border p-2 rounded w-full" 
                    step="0.01"
                    min="0"
                    max="100"
                  />
                )}
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <p className="font-medium mb-1">Tax Deduction Bands:</p>
                <ul className="text-xs space-y-1">
                  <li>• First Rs. 500,000: 1%</li>
                  <li>• Next Rs. 200,000: 10%</li>
                  <li>• Next Rs. 300,000: 20%</li>
                  <li>• Above Rs. 1,000,000: 30%</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setBulkGenerateModal(false)} 
                  className="px-4 py-2 rounded border hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {payslipModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold mb-4">Payslip</h2>
                          <div className="space-y-2 text-sm">
              <div className="border-b pb-2">
                <p><strong>Employee:</strong> {selectedPayslip.employee_name}</p>
                <p><strong>Department:</strong> {selectedPayslip.department_name}</p>
                <p><strong>Period:</strong> {selectedPayslip.month} {selectedPayslip.year}</p>
              </div>
              <div className="space-y-1">
                <p><strong>Basic Salary:</strong> Rs. {(parseFloat(selectedPayslip.basic) || 0).toFixed(2)}</p>
                <p><strong>Bonus:</strong> Rs. {(parseFloat(selectedPayslip.bonus )|| 0).toFixed(2)}</p>
                <p><strong>Tax Deductions:</strong> Rs. {(parseFloat(selectedPayslip.deductions) || 0).toFixed(2)}</p>
                <div className="border-t pt-2">
                  <p className="text-lg"><strong>Net Salary: Rs. {(parseFloat(selectedPayslip.net_salary) || 0).toFixed(2)}</strong></p>
                  <p><strong>Status:</strong> {selectedPayslip.status?.toUpperCase()}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => setPayslipModal(false)} 
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={downloadPayslip} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}