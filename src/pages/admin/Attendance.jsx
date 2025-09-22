import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import API from "../../api"; // Axios instance with auth token
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Attendance() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [attendance, setAttendance] = useState([]);
  const [filter, setFilter] = useState("all"); // all, today, yesterday, tomorrow
  const [sortAsc, setSortAsc] = useState(true);

  // Convert UTC date string to Nepal local date string (yyyy-MM-dd)
  const toNepaliDate = (utcDateStr) => {
    const utcDate = new Date(utcDateStr);
    const nepaliDate = new Date(utcDate.getTime() + (5 * 60 + 45) * 60000);
    return nepaliDate.toISOString().split("T")[0]; // yyyy-MM-dd
  };

  // Convert UTC date + time string to Nepal local time (HH:mm:ss)
const toNepaliTime = (timeStr) => {
  if (!timeStr) return "-";
  return timeStr; // Already stored in Nepal time
};

  // Fetch attendance records
  const fetchAttendance = async () => {
    try {
      const { data } = await API.get("/admin/attendance");
      setAttendance(data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to fetch attendance");
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Filter records
  const filtered = attendance.filter((a) => {
    const nepaliDate = toNepaliDate(a.date);
    if (filter === "all") return true;
    if (filter === "today") return nepaliDate === todayStr;
    if (filter === "yesterday")
      return nepaliDate === format(subDays(new Date(), 1), "yyyy-MM-dd");
    if (filter === "tomorrow")
      return nepaliDate === format(addDays(new Date(), 1), "yyyy-MM-dd");
    return true;
  });

  // Sort records
  const sorted = [...filtered].sort((a, b) => {
    if (sortAsc) return new Date(a.date) - new Date(b.date);
    else return new Date(b.date) - new Date(a.date);
  });

  const toggleSort = () => setSortAsc(!sortAsc);

  return (
    <div className="p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Attendance</h1>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center justify-between mb-4 space-y-2">
        <div className="space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("today")}
            className={`px-3 py-1 rounded ${
              filter === "today" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter("yesterday")}
            className={`px-3 py-1 rounded ${
              filter === "yesterday" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Yesterday
          </button>
          {/* <button
            onClick={() => setFilter("tomorrow")}
            className={`px-3 py-1 rounded ${
              filter === "tomorrow" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Tomorrow
          </button> */}
        </div>
        <button onClick={toggleSort} className="bg-gray-200 px-3 py-1 rounded">
          {sortAsc ? "Sort Desc" : "Sort Asc"}
        </button>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Employee</th>
              <th className="p-2">Date</th>
              <th className="p-2">Check-In</th>
              <th className="p-2">Check-Out</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{toNepaliDate(a.date)}</td>
                <td className="p-2">{toNepaliTime(a.check_in)}</td>
                <td className="p-2">{toNepaliTime(a.check_out)}</td>
                <td
                  className={`p-2 font-bold capitalize ${
                    a.status === "present" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {a.status}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
