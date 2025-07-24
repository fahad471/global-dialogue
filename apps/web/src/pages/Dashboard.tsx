import React from "react";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";
import Feed from "../components/Feed";

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
  <section className="max-w-4xl mx-auto bg-surface rounded-3xl shadow-2xl p-6 transition-colors duration-300">
    <h1 className="text-3xl font-bold mb-4 text-center">Public Feed</h1>
    <Feed />
  </section>
</main>
      </div>
    </div>
  );
};

export default Dashboard;
