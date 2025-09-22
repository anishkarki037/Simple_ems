import { useEffect, useState } from "react";
import API from "../../api";
import { toast } from "react-toastify";

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [name, setName] = useState("");

  const fetchPositions = async () => {
    try {
      const { data } = await API.get("/admin/positions");
      setPositions(data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to fetch positions");
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const addPosition = async () => {
    if (!name) return toast.error("Enter a position name");
    await API.post("/admin/positions", { name });
    toast.success("Position added");
    setName("");
    fetchPositions();
  };

  const deletePosition = async (id) => {
    await API.delete(`/admin/positions/${id}`);
    toast.info("Position deleted");
    fetchPositions();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Positions</h1>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Position Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded "
        />
        <button
          onClick={addPosition}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <ul>
        {positions.map((p) => (
          <li
            key={p.id}
            className="flex justify-between border p-2 mb-2 rounded items-center"
          >
            {p.name}
            <button
              onClick={() => deletePosition(p.id)}
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
