import React from "react";
import { FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { useTheme } from "../context/themeContext";

interface TopNavProps {
  signOut: () => Promise<void>;
}

export default function TopNav({ signOut }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="w-full sticky top-0 z-50 shadow-md flex items-center justify-between px-6 py-3
                 bg-white dark:bg-black transition-colors duration-300"
    >
      {/* Left - Logo and Site name */}
      <div className="flex items-center gap-3">
        <img
          src="/assets/logo.png"
          alt="Zyleno Logo"
          className="h-10 w-10 object-contain select-none"
        />
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Zyleno
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          className="flex items-center gap-2 rounded-md border border-gray-700 dark:border-gray-300 px-4 py-2
                     text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          {theme === "dark" ? (
            <>
              <FaSun />
              Light Mode
            </>
          ) : (
            <>
              <FaMoon />
              Dark Mode
            </>
          )}
        </button>

        <button
          onClick={signOut}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-md transition"
          title="Sign Out"
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    </header>
  );
}
