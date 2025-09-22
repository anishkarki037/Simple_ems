import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "http://localhost:5000/api/employee"; // Update to your API URL

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState({ checkedIn: false, checkedOut: false });

  // Fetch full attendance history
  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/my-attendance`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch attendance");
      const data = await response.json();
      setAttendance(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch today's attendance status
  const fetchTodayStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/today-attendance`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch today's status");
      const data = await response.json();
      setTodayStatus(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchTodayStatus();
  }, []);

  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/checkin`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || "Check-in failed");
      toast.success(result.msg || "Checked In for today");
      fetchAttendance();
      fetchTodayStatus();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.msg || "Check-out failed");
      toast.info(result.msg || "Checked Out");
      fetchAttendance();
      fetchTodayStatus();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-4">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">My Attendance</h1>

      {/* Check-in/Check-out Button */}
      <div className="mb-6">
        {!todayStatus.checkedIn && (
          <button
            onClick={handleCheckIn}
            className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600"
          >
            Check In
          </button>
        )}
        {todayStatus.checkedIn && !todayStatus.checkedOut && (
          <button
            onClick={handleCheckOut}
            className="bg-red-500 px-4 py-2 rounded text-white hover:bg-red-600"
          >
            Check Out
          </button>
        )}
        {todayStatus.checkedIn && todayStatus.checkedOut && (
          <span className="font-bold text-green-600">Today's attendance completed</span>
        )}
      </div>

      {/* Attendance Table */}
      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Date</th>
            <th className="p-2">Check In</th>
            <th className="p-2">Check Out</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.length > 0 ? attendance.map((a, i) => {
            const dateStr = format(new Date(a.date), "yyyy-MM-dd");
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

            return (
              <tr key={i} className={`border-b ${isToday ? "bg-yellow-100" : ""}`}>
                <td className="p-2">{dateStr}</td>
                <td className="p-2">{a.check_in || "-"}</td>
                <td className="p-2">{a.check_out || "-"}</td>
                <td className={`p-2 font-bold capitalize ${
                  a.status === "present" ? "text-green-500" : "text-red-500"
                }`}>{a.status}</td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan="4" className="text-center p-4">No attendance records</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
