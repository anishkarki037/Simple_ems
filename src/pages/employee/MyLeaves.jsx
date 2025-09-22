import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

const API_URL = "http://localhost:5000/api/employee";

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ start_date: "", end_date: "", reason: "" });
  const TOTAL_LEAVES = 12; // Total leaves per year

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/leaves`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch leaves");
      const data = await response.json();

      // Calculate remaining leaves
      const usedLeaves = data
        .filter(l => l.status === "approved") // Only count approved leaves
        .reduce((total, l) => {
          const start = new Date(l.start_date);
          const end = new Date(l.end_date);
          const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return total + diff;
        }, 0);

      const remaining = TOTAL_LEAVES - usedLeaves;

      // Map data to include start/end for display and remaining
      setLeaves(data.map(l => ({
        ...l,
        start: l.start_date.split('T')[0],
        end: l.end_date.split('T')[0],
        remaining: remaining
      })));
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/leaves`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || "Failed to apply for leave");

      toast.success("Leave applied, pending approval");
      setForm({ start_date: "", end_date: "", reason: "" });
      fetchLeaves();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">My Leaves</h1>
     <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-4 gap-4">
  <input
    type="date"
    name="start_date"
    value={form.start_date}
    onChange={handleChange}
    className="border p-2 rounded"
    required
    min={new Date().toISOString().split("T")[0]} // Start date can't be before today
  />
  <input
    type="date"
    name="end_date"
    value={form.end_date}
    onChange={handleChange}
    className="border p-2 rounded"
    required
    min={form.start_date || new Date().toISOString().split("T")[0]} // End date can't be before start date
  />
  <input
    type="text"
    name="reason"
    placeholder="Reason"
    value={form.reason}
    onChange={handleChange}
    className="border p-2 rounded"
    required
  />
  <button
    type="submit"
    className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600"
  >
    Apply Leave
  </button>
</form>


      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Start</th>
            <th className="p-2">End</th>
            <th className="p-2">Reason</th>
            <th className="p-2">Remaining Leaves</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l.id} className="border-b">
              <td className="p-2">{l.start}</td>
              <td className="p-2">{l.end}</td>
              <td className="p-2">{l.reason}</td>
              <td className="p-2 font-bold">{l.remaining}</td>
              <td className={`p-2 font-bold capitalize ${
                l.status === "approved" ? "text-green-500" :
                l.status === "pending" ? "text-yellow-500" : "text-red-500"
              }`}>{l.status}</td>
            </tr>
          ))}
          {leaves.length === 0 && <tr><td colSpan="5" className="text-center p-4">No leaves applied</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
