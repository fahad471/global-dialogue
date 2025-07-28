import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserFriends,
  FaMicrophoneAlt,
  FaTrophy,
  FaPlayCircle,
  FaCog,
} from "react-icons/fa";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <FaHome size={20} /> },
  { label: "Preferences", path: "/matchpreferences", icon: <FaUserFriends size={20} /> },
  { label: "Zynq", path: "/chat", icon: <FaMicrophoneAlt size={20} /> },
  { label: "Rankings", path: "/rankings", icon: <FaTrophy size={20} /> },
  { label: "Live", path: "/live", icon: <FaPlayCircle size={20} /> },
  { label: "Profile", path: "/profile", icon: <FaCog size={20} /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch username:", error.message);
      } else if (data?.username) {
        setUsername(data.username);
      }
    };

    fetchProfile();
  }, [user]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = username ? getInitials(username) : "LP";

  return (
    <aside className="w-72 bg-surface text-text shadow-xl flex flex-col sticky top-0 h-screen p-8">
      {/* Logo / Username Display */}
      <div
        className="mb-16 flex items-center space-x-4 cursor-pointer select-none"
        onClick={() => navigate("/dashboard")}
      >
        <div className="w-14 h-14 rounded-full bg-primary text-text font-extrabold flex items-center justify-center text-3xl shadow-lg">
          {initials}
        </div>
        <h1 className="text-4xl font-extrabold tracking-wider drop-shadow-lg">
          {username || "LogicPal"}
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
                  ? "bg-primary text-text shadow-md"
                  : "text-secondaryText hover:bg-background hover:text-primary"
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto" />
    </aside>
  );
}
