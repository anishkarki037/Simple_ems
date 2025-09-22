import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { jsPDF } from "jspdf";

const API_URL = "http://localhost:5000/api/employee";

export default function MySalary() {
  const [salaries, setSalaries] = useState([]);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/salaries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch salary data");
        const data = await response.json();
        setSalaries(data);
      } catch (error) {
        toast.error(error.message);
      }
    };
    fetchSalaries();
  }, []);

  const downloadPayslip = (salary) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("EMS by Aayush Nepal", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text("Payslip", 105, 30, null, null, "center");
    doc.line(20, 35, 190, 35); // horizontal line

    // Employee Info
    doc.setFontSize(11);
    doc.text(`Month: ${salary.month}`, 20, 45);
    doc.text(`Year: ${salary.year}`, 20, 52);
    doc.text(`Employee ID: ${salary.id}`, 140, 45);
    doc.text(`Status: ${salary.status}`, 140, 52);

    // Table Headers
    const startY = 65;
    doc.setFontSize(12);
    doc.text("Earnings / Deductions", 20, startY);
    doc.text("Amount (Rs.)", 150, startY);

    doc.line(20, startY + 2, 190, startY + 2);

    // Table Data
    const rowHeight = 8;
    let currentY = startY + 10;

    const rows = [
      { label: "Basic", value: salary.basic },
      { label: "Bonus", value: salary.bonus },
      { label: "Deductions", value: salary.deductions },
    ];

    rows.forEach((row) => {
      doc.text(row.label, 20, currentY);
      doc.text(`${row.value}`, 150, currentY, { align: "right" });
      currentY += rowHeight;
    });

    doc.line(20, currentY, 190, currentY); // line above total

    // Total
    const total = parseFloat(salary.basic) + parseFloat(salary.bonus) - parseFloat(salary.deductions);
    currentY += 5;
    doc.setFontSize(13);
    doc.text("Total", 20, currentY);
    doc.text(`${total}`, 150, currentY, { align: "right" });

    // Footer
    currentY += 15;
    doc.setFontSize(10);
    doc.text("This is a computer-generated payslip and does not require a signature.", 105, currentY, null, null, "center");

    doc.save(`Payslip-${salary.month}-${salary.year}.pdf`);
    toast.success("Payslip downloaded successfully!");
  };

  return (
    <div>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">My Salary</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Month</th>
              <th className="p-2">Year</th>
              <th className="p-2">Basic</th>
              <th className="p-2">Bonus</th>
              <th className="p-2">Deductions</th>
              <th className="p-2">Total</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.month}</td>
                <td className="p-2">{s.year}</td>
                <td className="p-2">Rs. {s.basic}</td>
                <td className="p-2">Rs. {s.bonus}</td>
                <td className="p-2">Rs. {s.deductions}</td>
                <td className="p-2">
                  Rs. {parseFloat(s.basic) + parseFloat(s.bonus) - parseFloat(s.deductions)}
                </td>
                <td className="p-2 capitalize">{s.status}</td>
                <td className="p-2">
                  <button
                    onClick={() => downloadPayslip(s)}
                    className="bg-blue-500 px-2 py-1 rounded text-white hover:bg-blue-600"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
            {salaries.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center p-4">
                  No salary records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
