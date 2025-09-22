import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div
      className="w-full flex justify-between items-center px-6 py-3 text-white shadow-md"
       style={{
        backgroundColor: "#1f2937", // dark gray for minimal modern look
      }}
    >
      {/* Logo / Title */}
      <h1 className="text-xl font-semibold tracking-wide drop-shadow-md">
        EMS by Aayush Nepal
      </h1>

      {/* User Info + Logout */}
      <div className="flex items-center gap-4">
        <span className="font-medium drop-shadow-sm">{user?.email}</span>
         <button
          onClick={logout}
          className="px-4 py-1 rounded-md bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
