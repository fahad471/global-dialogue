import React from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";

interface DashboardProps {
  signOut: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ signOut }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-12 overflow-y-auto">
          <section className="max-w-5xl mx-auto bg-surface rounded-3xl shadow-2xl p-12 text-center transition-colors duration-300">
            <h1 className="text-5xl font-extrabold mb-6">
              Welcome to MicSpot Dashboard
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed">
              This is your main hub to navigate matches, chats, rankings, and your
              profile. Use the sidebar to switch sections. Toggle dark mode with the
              button above. Stay productive and keep crushing it!
            </p>
            <span className="text-error text-xl font-bold">Tailwind works!</span>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
