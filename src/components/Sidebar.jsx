import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AiOutlineDashboard,
  AiOutlineTeam,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineCalendar,
  AiOutlineMoneyCollect,
  AiOutlineFolderOpen,
  AiOutlineMenu,
} from "react-icons/ai";
import Logo from "../assets/logo.png";

export default function Sidebar({ user }) {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const navLinksAdmin = [
    { name: "Dashboard", path: "/admin", icon: <AiOutlineDashboard /> },
    { name: "Employees", path: "/admin/employees", icon: <AiOutlineTeam /> },
    { name: "Departments", path: "/admin/departments", icon: <AiOutlineFolderOpen /> },
    { name: "Positions", path: "/admin/positions", icon: <AiOutlineUser /> },
    { name: "Attendance", path: "/admin/attendance", icon: <AiOutlineCalendar /> },
    { name: "Leaves", path: "/admin/leaves", icon: <AiOutlineFileText /> },
    { name: "Salaries", path: "/admin/salaries", icon: <AiOutlineMoneyCollect /> },
  ];

  const navLinksEmployee = [
    { name: "Dashboard", path: "/employee", icon: <AiOutlineDashboard /> },
    { name: "My Attendance", path: "/employee/attendance", icon: <AiOutlineCalendar /> },
    { name: "My Leaves", path: "/employee/leaves", icon: <AiOutlineFileText /> },
    { name: "My Salary", path: "/employee/salary", icon: <AiOutlineMoneyCollect /> },
    { name: "My Profile", path: "/employee/profile", icon: <AiOutlineUser /> },
  ];

  const links = user.role === "admin" ? navLinksAdmin : navLinksEmployee;

  return (
    <div
      className={`h-screen p-4 text-white transition-all duration-300 shadow-xl relative overflow-hidden
        ${open ? "w-64" : "w-20"}`}
      style={{
        backgroundColor: "#1f2937", // dark gray for minimal modern look
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Profile Section */}
        <div className={`flex flex-col items-center mb-8 transition-all duration-300 ${open ? "" : "justify-center"}`}>
          <img
            src={Logo}
            alt="logo"
            className="w-14 h-14 rounded-full mb-2 border-2 border-gray-500/40 shadow-sm"
          />
          {open && (
            <div className="text-center">
              <h2 className="font-semibold text-lg">{user.name}</h2>
              <p className="text-sm text-gray-300">{user.position}</p>
              <p className="text-sm text-gray-400">{user.department}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-4 px-4 py-2 rounded-lg transition-all duration-300 text-gray-200
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "hover:bg-gray-700 hover:text-white"
                  }`}
              >
                <span className="text-2xl">{link.icon}</span>
                {open && <span className="font-medium">{link.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          className="self-center mt-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors text-white shadow-md"
        >
          <AiOutlineMenu className="text-xl" />
        </button>
      </div>
    </div>
  );
}
