import { useState, useEffect } from "react";
import API from "../../api"; // Make sure Axios instance is configured with token
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");

  // Fetch leaves from backend
  const fetchLeaves = async () => {
    try {
      const { data } = await API.get("/admin/leaves");
      setLeaves(data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to fetch leaves");
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Update leave status
  const updateStatus = async (id, status) => {
    try {
      await API.put(`/admin/leaves/${id}`, { status });
      toast.success(`Leave ${status}`);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to update leave status");
    }
  };

  const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

  // Filter leaves by employee name
  const filtered = leaves.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Leave Requests</h1>

      <input
        type="text"
        placeholder="Search employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded mb-4 w-64"
      />

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Employee</th>
              <th className="p-2">Start</th>
              <th className="p-2">End</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Remaining Leaves</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b">
                <td className="p-2">{l.name}</td>
                <td className="p-2">{formatDate(l.start_date)}</td>
                <td className="p-2">{formatDate(l.end_date)}</td>
                <td className="p-2">{l.reason}</td>
                <td className="p-2">{l.remaining_leaves}</td>
                <td className="p-2 capitalize">{l.status}</td>
                <td className="p-2 space-x-2">
                  {l.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(l.id, "approved")}
                        className="bg-green-500 px-2 py-1 rounded text-white hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(l.id, "rejected")}
                        className="bg-red-500 px-2 py-1 rounded text-white hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No leaves found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
