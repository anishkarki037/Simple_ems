import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import Employees from "./pages/admin/Employees";
import Attendance from "./pages/admin/Attendance";
import Departments from "./pages/admin/Departments";
import Positions from "./pages/admin/Positions";
import Leaves from "./pages/admin/Leaves";
import Salaries from "./pages/admin/Salaries";
import EmployeeDashboard from "./pages/employee/Dashboard";
import MyAttendance from "./pages/employee/MyAttendance";
import MyLeaves from "./pages/employee/MyLeaves";
import MySalary from "./pages/employee/MySalary";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Profile from "./pages/employee/Profile";

function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/employees"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Departments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/positions"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Positions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/leaves"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Leaves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/salaries"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Salaries />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Employee Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/attendance"
        element={
          <ProtectedRoute role="employee">
            <Layout>
              <MyAttendance />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/leaves"
        element={
          <ProtectedRoute role="employee">
            <Layout>
              <MyLeaves />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/salary"
        element={
          <ProtectedRoute role="employee">
            <Layout>
              <MySalary />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <ProtectedRoute role="employee">
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
