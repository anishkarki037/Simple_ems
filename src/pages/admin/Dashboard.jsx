import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    employees: 0,
    pendingLeaves: 0,
    attendancePercent: 0,
    salariesPending: 0
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

  // Helper function to fetch data with proper error handling
  const fetchData = async (endpoint) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5000/api/admin${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        throw new Error(`API endpoint returned HTML instead of JSON. Check if endpoint exists. Response: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      throw err;
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Test API connection first
      try {
        const testResult = await fetchData('/test-db');
        console.log('Database test result:', testResult);
      } catch (testErr) {
        console.warn('Test endpoint failed, but continuing...', testErr);
      }

      let employees = [];
      let leaves = [];
      let attendance = [];
      let salaries = [];

      // Fetch all data in parallel
      try {
        employees = await fetchData('/employees');
      } catch (err) {
        console.error('Failed to fetch employees, using empty array');
        employees = [];
      }

      try {
        leaves = await fetchData('/leaves');
      } catch (err) {
        console.error('Failed to fetch leaves, using empty array');
        leaves = [];
      }

      try {
        attendance = await fetchData('/attendance');
      } catch (err) {
        console.error('Failed to fetch attendance, using empty array');
        attendance = [];
      }

      try {
        salaries = await fetchData('/salaries');
      } catch (err) {
        console.error('Failed to fetch salaries, using empty array');
        salaries = [];
      }

      // Calculate statistics
      const pendingLeaves = Array.isArray(leaves) ? leaves.filter(leave => leave.status === 'pending').length : 0;
      
      // Calculate attendance percentage
      let attendancePercent = 0;
      if (Array.isArray(attendance) && attendance.length > 0) {
        const totalRecords = attendance.length;
        const presentRecords = attendance.filter(record => 
          record.status === 'present' || record.check_in
        ).length;
        attendancePercent = Math.round((presentRecords / totalRecords) * 100);
      }

      const pendingSalaries = Array.isArray(salaries) ? salaries.filter(salary => salary.status === 'unpaid').length : 0;

      // Update stats
      setStats({
        employees: Array.isArray(employees) ? employees.length : 0,
        pendingLeaves,
        attendancePercent,
        salariesPending: pendingSalaries
      });

      // Prepare charts data
      if (Array.isArray(attendance)) {
        const monthlyAttendance = calculateMonthlyAttendance(attendance);
        setAttendanceData(monthlyAttendance);
      }

      if (Array.isArray(employees)) {
        const departmentDistribution = calculateDepartmentDistribution(employees);
        setDepartmentData(departmentDistribution);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get last 6 months for chart
  const getLast6Months = () => {
    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        monthNumber: date.getMonth() + 1
      });
    }
    
    return months;
  };

  // Calculate monthly attendance percentage
  const calculateMonthlyAttendance = (attendance) => {
    const months = getLast6Months();
    
    return months.map(({ month, year, monthNumber }) => {
      const monthAttendance = attendance.filter(record => {
        if (!record.date) return false;
        try {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() + 1 === monthNumber && recordDate.getFullYear() === year;
        } catch (e) {
          return false;
        }
      });
      
      const total = monthAttendance.length;
      const present = monthAttendance.filter(record => 
        record.status === 'present' || record.check_in
      ).length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return { month: `${month} ${year.toString().slice(2)}`, attendance: percentage };
    });
  };

  // Calculate department distribution
  const calculateDepartmentDistribution = (employees) => {
    const departmentCount = {};
    
    employees.forEach(employee => {
      const deptName = employee.department_name || employee.department || 'Unassigned';
      departmentCount[deptName] = (departmentCount[deptName] || 0) + 1;
    });
    
    return Object.entries(departmentCount).map(([name, value]) => ({
      name,
      value
    }));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2 text-sm text-red-700">
            <p>Possible issues:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>API endpoints might not be properly configured</li>
              <li>Check if the backend server is running</li>
              <li>Verify that you're authenticated</li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={fetchDashboardData}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <p className="text-gray-500 text-sm font-medium">Total Employees</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.employees}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center ">
          <p className="text-gray-500 text-sm font-medium">Pending Leaves</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingLeaves}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <p className="text-gray-500 text-sm font-medium">Attendance %</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.attendancePercent}%</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
          <p className="text-gray-500 text-sm font-medium">Salaries Pending</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.salariesPending}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Monthly Attendance Trend</h2>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <XAxis dataKey="month"/>
                <YAxis domain={[0, 100]}/>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Attendance']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="attendance" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No attendance data available</p>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Employees by Department</h2>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={departmentData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                  }
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value, name) => [value, `${name} Employees`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No department data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}