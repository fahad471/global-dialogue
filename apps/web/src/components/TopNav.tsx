// import { FaMoon, FaSun, FaSignOutAlt } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";

interface TopNavProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  signOut: () => Promise<void>;
}

export default function TopNav({ signOut }: TopNavProps) {
  return (
    <header className="w-full sticky top-0 z-50 shadow-md flex items-center justify-between px-6 py-3 bg-surface text-text transition-colors duration-300">
      {/* Left - Logo and Site name */}
      <div className="flex items-center gap-3">
        <img
          src="/assets/logo.png"
          alt="Zynqer Logo"
          className="h-10 w-10 object-contain select-none"
        />
        <span className="text-xl font-bold text-text">Zynqer</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-6">
        {/* <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          className="flex items-center gap-2 rounded-md border border-secondaryText px-4 py-2 text-secondaryText font-semibold hover:bg-background transition"
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
        </button> */}

        <button
          onClick={signOut}
          className="flex items-center gap-2 bg-primary hover:bg-accent text-text font-semibold px-4 py-2 rounded-md transition"
          title="Sign Out"
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    </header>
  );
}
