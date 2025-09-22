import { useState, useEffect } from "react";
import API from "../../api"; // Make sure axios instance is configured
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department_id: "",
    position_id: "",
    salary: "",
    phone: "",
    photo: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const { data } = await API.get("/admin/employees");
      setEmployees(data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to fetch employees");
    }
  };

  // Fetch departments and positions
  const fetchDepsPositions = async () => {
    try {
      const dep = await API.get("/admin/departments");
      const pos = await API.get("/admin/positions");
      setDepartments(dep.data);
      setPositions(pos.data);
    } catch (err) {
      toast.error("Failed to load departments or positions");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepsPositions();
  }, []);

  // Filter employees
  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  // Handle form changes
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Reset form
  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      department_id: "",
      position_id: "",
      salary: "",
      phone: "",
      photo: "",
    });
    setEditingId(null);
  };

  // Submit add/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // For updates, don't send password unless it's provided
        const updateData = { ...form };
        if (!updateData.password) {
          delete updateData.password;
        }
        await API.put(`/admin/employees/${editingId}`, updateData);
        toast.success("Employee updated!");
      } else {
        // For new employees, password is required
        if (!form.password) {
          toast.error("Password is required for new employees");
          return;
        }
        await API.post("/admin/employees", form);
        toast.success("Employee added!");
      }
      resetForm();
      setModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to save employee");
    }
  };

  // Edit employee
  const handleEdit = (emp) => {
    setForm({
      name: emp.name,
      email: emp.email,
      password: "", // Don't prefill password for security
      department_id: emp.department_id,
      position_id: emp.position_id,
      salary: emp.salary,
      phone: emp.phone || "",
      photo: emp.photo || "",
    });
    setEditingId(emp.id);
    setModalOpen(true);
  };

  // Delete employee
 const handleDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this employee?")) {
    try {
      await API.delete(`/admin/employees/${id}`);
      toast.info("Employee deleted");
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to delete employee");
    }
  }
};

  // Open add modal
  const handleAddNew = () => {
    resetForm();
    setModalOpen(true);
  };

  return (
    <div>
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Employees</h1>

      {/* Top controls */}
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />
        <button
          onClick={handleAddNew}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Employee
        </button>
      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Department</th>
              <th className="p-2">Position</th>
              <th className="p-2">Base Salary</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{emp.name}</td>
                <td className="p-2">{emp.email}</td>
                <td className="p-2">{emp.department_name || emp.department}</td>
                <td className="p-2">{emp.position_name || emp.position}</td>
                <td className="p-2">Rs. {emp.salary ? Number(emp.salary).toLocaleString() : '0'}</td>
                <td className="p-2">{emp.phone || 'N/A'}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleEdit(emp)}
                    className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 text-white text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Employee" : "Add Employee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="password"
                name="password"
                placeholder={editingId ? "Password (leave blank to keep current)" : "Password"}
                value={form.password}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required={!editingId}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              />
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                name="position_id"
                value={form.position_id}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              >
                <option value="">Select Position</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="salary"
                placeholder="Salary"
                value={form.salary}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
                min="0"
                step="0.01"
              />
              {/* <input
                type="url"
                name="photo"
                placeholder="Photo URL (optional)"
                value={form.photo}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              /> */}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
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
    </div>
  );
}