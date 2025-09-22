import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/employee";

export default function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      const data = await res.json();
      setDashboard(data);
      setLoading(false);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);
    const navigate = useNavigate();
  const handleCheckIn = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/checkin`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Check-in failed");
      toast.success(data.msg);
      fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/checkout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Check-out failed");
      toast.info(data.msg);
      fetchDashboard();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!dashboard) return <p>No data</p>;

  
  function toNepaliHourDecimal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  // Just combine date + time as local
  const localDateTime = new Date(`${dateStr.split("T")[0]}T${timeStr}`);

  return localDateTime.getHours() + localDateTime.getMinutes() / 60;
}

  const attendanceTrend = dashboard.attendanceTrend.map(a => ({
    date: new Date(a.date).toLocaleDateString("en-GB"),
    checkInHour: toNepaliHourDecimal(a.date, a.check_in),
    checkOutHour: toNepaliHourDecimal(a.date, a.check_out)
  }));

  return (
    <div className="space-y-6 p-4">
      <ToastContainer />
      <h1 className="text-3xl font-bold">Employee Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded p-4 flex flex-col items-center">
          <p className="text-gray-500">Days Present</p>
          <p className="text-2xl font-bold">{dashboard.presentDays}</p>
        </div>
        <div className="bg-white shadow rounded p-4 flex flex-col items-center">
          <p className="text-gray-500">Leaves Taken</p>
          <p className="text-2xl font-bold">{dashboard.leavesTaken}</p>
        </div>
        <div className="bg-white shadow rounded p-4 flex flex-col items-center">
          <p className="text-gray-500">Salary Status</p>
          <p className={`text-2xl font-bold ${dashboard.salaryStatus.toLowerCase() === "paid" ? "text-green-500" : "text-red-500"}`}>
            {dashboard.salaryStatus}
          </p>
        </div>
      </div>

     

      {/* Quick Actions */}
      <div className="flex space-x-4">
        {!dashboard.todayStatus.checkedIn ?
          <button onClick={handleCheckIn} className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600">Check In</button> :
          !dashboard.todayStatus.checkedOut ?
            <button onClick={handleCheckOut} className="bg-red-500 px-4 py-2 rounded text-white hover:bg-red-600">Check Out</button> :
            <button disabled className="bg-gray-400 px-4 py-2 rounded text-white">Done for Today</button>
        }
        <button onClick={()=> navigate("/employee/leaves")} className="bg-green-500 px-4 py-2 rounded text-white hover:bg-green-600">Apply Leave</button>
      </div>

      {/* Attendance Trend Chart */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-2">Attendance Trend (Last 7 Days)</h2>
        <LineChart width={700} height={300} data={attendanceTrend}>
          <XAxis dataKey="date" />
          <YAxis domain={[0, 24]} label={{ value: 'Hour', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => {
            if (!value) return "Absent";
            const h = Math.floor(value);
            const m = Math.round((value % 1) * 60);
            return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
          }} />
          <Line type="monotone" dataKey="checkInHour" name="Check-In" stroke="#3b82f6" />
          <Line type="monotone" dataKey="checkOutHour" name="Check-Out" stroke="#ef4444" />
        </LineChart>
      </div>
       {/* Salary Breakdown */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-bold mb-2">Salary Breakdown (Last 3 Months)</h2>
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Month</th>
              <th className="p-2 border">Basic</th>
              <th className="p-2 border">Bonus</th>
              <th className="p-2 border">Deductions</th>
              <th className="p-2 border">Net</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.salaryBreakdown.map((s, i) => (
              <tr key={i} className="text-center">
                <td className="p-2 border">{s.month} {s.year}</td>
                <td className="p-2 border">{s.basic}</td>
                <td className="p-2 border">{s.bonus}</td>
                <td className="p-2 border">{s.deductions}</td>
                <td className="p-2 border">{(parseFloat(s.basic) + parseFloat(s.bonus) - parseFloat(s.deductions)).toFixed(2)}</td>
                <td className={`p-2 border ${s.status === "paid" ? "text-green-500" : "text-red-500"}`}>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
