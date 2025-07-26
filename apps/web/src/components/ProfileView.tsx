import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import { FaTwitter, FaLinkedin, FaGlobe, FaGithub } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";
import { useAuth } from "../context/AuthProvider";

export default function ProfileView() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!error && data) {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) return <div className="p-10 text-center text-lg" style={{ color: "var(--color-text)" }}>Loading...</div>;
  if (!profile) return <div className="p-10 text-center" style={{ color: "var(--color-primary)" }}>Profile not found.</div>;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
    >
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={auth?.signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-10">

            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-md"
                style={{ backgroundColor: "var(--color-mutedText)", color: "var(--color-primary)" }}
              >
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <h1 style={{ color: "var(--color-text)" }} className="text-3xl font-bold mt-4">
                {profile.name}
              </h1>
              <p style={{ color: "var(--color-secondaryText)" }}>
                @{profile.username}
              </p>
            </div>

            {/* Bio + Ideology */}
            <div
              className="rounded-xl shadow-lg p-6"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                About Me
              </h2>
              <p style={{ color: "var(--color-mutedText)" }}>
                {profile.bio || "No bio provided."}
              </p>

              <div className="mt-4">
                <h3 className="font-medium" style={{ color: "var(--color-text)" }}>
                  Ideological Stance:
                </h3>
                <p
                  className="font-bold"
                  style={{ color: "var(--color-primary)" }} // red text for stance for visibility
                >
                  {profile.ideological_stance || "N/A"}
                </p>
                <p className="italic text-sm mt-1" style={{ color: "var(--color-mutedText)" }}>
                  {profile.ideology_description || "No description."}
                </p>
              </div>
            </div>

            {/* Values & Beliefs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="p-6 rounded-xl shadow"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  Core Values
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.core_values?.length > 0 ? (
                    profile.core_values.map((val: string) => (
                      <Badge
                        key={val}
                        className="text-sm px-3 py-1"
                        style={{
                          backgroundColor: "var(--color-primary)", // red background
                          color: "var(--color-text)",              // white text
                          border: `1px solid var(--color-border)`,
                        }}
                      >
                        {val}
                      </Badge>
                    ))
                  ) : (
                    <span style={{ color: "var(--color-mutedText)" }}>None</span>
                  )}
                </div>
              </div>

              <div
                className="p-6 rounded-xl shadow"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  Core Beliefs
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.core_beliefs?.length > 0 ? (
                    profile.core_beliefs.map((b: string) => (
                      <Badge
                        key={b}
                        className="text-sm px-3 py-1"
                        style={{
                          backgroundColor: "var(--color-primary)", // red background
                          color: "var(--color-text)",               // white text
                          border: `1px solid var(--color-border)`,
                        }}
                      >
                        {b}
                      </Badge>
                    ))
                  ) : (
                    <span style={{ color: "var(--color-mutedText)" }}>None</span>
                  )}
                </div>
                <p className="text-sm mt-2" style={{ color: "var(--color-mutedText)" }}>
                  Belief Strength: {profile.belief_strength}/10
                </p>
              </div>
            </div>

            {/* Personality & Conversation Style */}
            <div
              className="p-6 rounded-xl shadow space-y-2"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <h3 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                Conversation & Personality
              </h3>
              <p><strong>MBTI:</strong> {profile.personality_type || "N/A"}</p>
              <p><strong>Style:</strong> {profile.conversation_style || "N/A"}</p>
              <p><strong>Influences:</strong> {profile.influences || "N/A"}</p>
            </div>

            {/* Social Links */}
            <div
              className="p-6 rounded-xl shadow space-y-3"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                Social Links
              </h3>
              <div className="flex gap-4 text-xl" style={{ color: "var(--color-accent)" }}>
                {profile.twitter && (
                  <a href={profile.twitter} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>
                    <FaTwitter />
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>
                    <FaLinkedin />
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>
                    <FaGlobe />
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>
                    <FaGithub />
                  </a>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
