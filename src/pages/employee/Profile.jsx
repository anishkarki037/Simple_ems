import { useEffect, useState } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { parse } from "date-fns";

export default function Profile() {
  const [profile, setProfile] = useState({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  // Fetch profile
  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/employee/profile");
      setProfile(data);
      setName(data.name);
      setPhone(data.phone);
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async () => {
    try {
      await API.put("/employee/profile", { name, phone, photo: profile.photo });
      toast.success("Profile updated");
      fetchProfile();
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    }
  };

  // Leaves
  const fetchLeaves = async () => {
    const { data } = await API.get("/employee/leaves");
    setLeaves(data);
  };

  const applyLeave = async () => {
    try {
      await API.post("/employee/leaves", leaveForm);
      toast.success("Leave applied");
      setLeaveForm({ start_date: "", end_date: "", reason: "" });
      fetchLeaves();
    } catch (err) {
      toast.error("Failed to apply leave");
    }
  };

  // Salaries
  const fetchSalaries = async () => {
    const { data } = await API.get("/employee/salaries");
    setSalaries(data);
  };

  // Attendance
  const fetchAttendance = async () => {
    const { data } = await API.get("/employee/my-attendance");
    setAttendance(data);
  };

  const checkIn = async () => {
    try {
      await API.post("/employee/checkin");
      toast.success("Checked in successfully");
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Check-in failed");
    }
  };
const [passwordForm, setPasswordForm] = useState({
  current_password: "",
  new_password: "",
  confirm_password: "",
});

const resetPassword = async () => {
  const { current_password, new_password, confirm_password } = passwordForm;

  if (!new_password || !confirm_password) {
    toast.error("Please fill all password fields");
    return;
  }

  if (new_password !== confirm_password) {
    toast.error("New password and confirmation do not match");
    return;
  }

  try {
    await API.put("/employee/reset-password", { current_password, new_password });
    toast.success("Password updated successfully");
    setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
  } catch (err) {
    toast.error(err.response?.data?.msg || "Failed to reset password");
  }
};
  const checkOut = async () => {
    try {
      await API.post("/employee/checkout");
      toast.success("Checked out successfully");
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Check-out failed");
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchLeaves();
    fetchSalaries();
    fetchAttendance();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Employee Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["profile", "attendance", "leaves", "salaries",, "password"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="space-y-4 max-w-md">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Name"
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Phone"
          />
          <button
            onClick={updateProfile}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Update Profile
          </button>
        </div>
      )}

      {activeTab === "attendance" && (
        <div>
          <div className="flex gap-4 mb-4">
            <button
              onClick={checkIn}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Check In
            </button>
            <button
              onClick={checkOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Check Out
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Check In</th>
                <th className="border px-2 py-1">Check Out</th>
                <th className="border px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.id} className="text-center">
                  <td className="border px-2 py-1">{a.date}</td>
                  <td className="border px-2 py-1">{a.check_in || "-"}</td>
                  <td className="border px-2 py-1">{a.check_out || "-"}</td>
                  <td className="border px-2 py-1">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="date"
              value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
              className="border p-2 rounded"
            />
          </div>
          <input
            type="text"
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            placeholder="Reason"
            className="border p-2 rounded w-full"
          />
          <button
            onClick={applyLeave}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Apply Leave
          </button>

          <table className="w-full border-collapse mt-4">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Start Date</th>
                <th className="border px-2 py-1">End Date</th>
                <th className="border px-2 py-1">Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id} className="text-center">
                  <td className="border px-2 py-1">{l.start_date}</td>
                  <td className="border px-2 py-1">{l.end_date}</td>
                  <td className="border px-2 py-1">{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "salaries" && (
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Month</th>
                <th className="border px-2 py-1">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((s) => (
                <tr key={s.id} className="text-center">
                  <td className="border px-2 py-1">{s.month}</td>
                  <td className="border px-2 py-1">{parseFloat(s.basic )+ parseFloat(s.bonus)-parseFloat(s.deductions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === "password" && (
  <div className="space-y-4 max-w-md">
    <input
      type="password"
      value={passwordForm.current_password}
      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
      placeholder="Current Password"
      className="border p-2 rounded w-full"
    />
    <input
      type="password"
      value={passwordForm.new_password}
      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
      placeholder="New Password"
      className="border p-2 rounded w-full"
    />
    <input
      type="password"
      value={passwordForm.confirm_password}
      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
      placeholder="Confirm New Password"
      className="border p-2 rounded w-full"
    />
    <button
      onClick={resetPassword}
      className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
    >
      Reset Password
    </button>
  </div>
)}
    </div>
  );
}
