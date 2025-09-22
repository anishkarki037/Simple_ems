import { useEffect, useState } from "react";
import API from "../../api";
import { toast } from "react-toastify";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");

  const fetchDepartments = async () => {
    const { data } = await API.get("/admin/departments");
    setDepartments(data);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const addDepartment = async () => {
    await API.post("/admin/departments", { name });
    toast.success("Department added");
    setName("");
    fetchDepartments();
  };

  const deleteDepartment = async (id) => {
    await API.delete(`/admin/departments/${id}`);
    toast.info("Department deleted");
    fetchDepartments();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Departments</h1>
      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Department Name"
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={addDepartment}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <ul>
        {departments.map((d) => (
          <li key={d.id} className="flex justify-between border p-2 mb-2 rounded">
            {d.name}
            <button
              onClick={() => deleteDepartment(d.id)}
              className="bg-red-500 px-2 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
