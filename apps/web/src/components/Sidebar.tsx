import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaComments,
  FaGraduationCap,
  FaBookOpen,
  FaCog,
} from "react-icons/fa";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <FaHome size={20} /> },
  { label: "Match", path: "/matchpreferences", icon: <FaUsers size={20} /> },
  { label: "Live Chats", path: "/chat", icon: <FaComments size={20} /> },
  { label: "Rankings", path: "/rankings", icon: <FaGraduationCap size={20} /> },
  { label: "Discovery", path: "/discovery", icon: <FaBookOpen size={20} /> },
  { label: "Profile", path: "/profile", icon: <FaCog size={20} /> },  // Capitalized
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-72 bg-[#181818] text-[#f5f5f5] shadow-xl flex flex-col sticky top-0 h-screen p-8">
      {/* Logo */}
      <div
        className="mb-16 flex items-center space-x-4 cursor-pointer select-none"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-14 h-14 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-3xl shadow-lg">
          LP
        </div>
        <h1 className="text-4xl font-extrabold tracking-wider drop-shadow-lg">
          LogicPal
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col space-y-4 flex-grow">
        {navItems.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-4 text-lg font-semibold rounded-md px-4 py-3 transition-colors duration-200
              ${
                isActive
                  ? "bg-purple-600 text-[#f5f5f5] shadow-md"
                  : "text-[#b3b3b3] hover:bg-[#2c2c2c] hover:text-purple-600"
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom space */}
      <div className="mt-auto" />
    </aside>
  );
}
