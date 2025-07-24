import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";
import { useTopics } from "../hooks/useTopics";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";
import { useNavigate } from "react-router-dom";

interface MatchPreferencesProps {
  signOut: () => Promise<void>;
}

export default function MatchPreferences({ signOut }: MatchPreferencesProps) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const topics = useTopics();
  const navigate = useNavigate();

  const [matchType, setMatchType] = useState<"random" | "opposite" | "similar" | "topic">("random");
  const [selectedTopicsWithStance, setSelectedTopicsWithStance] = useState<{ id: string; stance: "for" | "against" }[]>([]);
  const [language, setLanguage] = useState("");
  const [nationality, setNationality] = useState("");

  const { user } = auth || {};

  const languages = [
    "None", "English", "Spanish", "French", "German", "Chinese", "Arabic", "Hindi", "Portuguese", "Russian", "Japanese",
    "Korean", "Turkish", "Italian", "Dutch", "Greek", "Polish", "Hebrew", "Swedish", "Norwegian"
  ];

  const nationalities = [
    "American", "Canadian", "British", "French", "German", "Indian", "Chinese", "Brazilian", "Nigerian", "Australian",
    "Mexican", "Japanese", "Russian", "Egyptian", "South African", "Italian", "Turkish", "Korean", "Spanish"
  ];

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data: prefData } = await supabase
        .from("user_match_preferences")
        .select("preferred_match_type, language, nationality")
        .eq("id", user.id)
        .single();

      if (prefData) {
        setMatchType(prefData.preferred_match_type || "random");
        setLanguage(prefData.language || "");
        setNationality(prefData.nationality || "");
      }

      const { data: selectedTopics } = await supabase
        .from("user_selected_topics")
        .select("topic_id, stance")
        .eq("user_id", user.id);

      if (selectedTopics) {
        setSelectedTopicsWithStance(
          selectedTopics.map((t) => ({
            id: t.topic_id,
            stance: t.stance === "against" ? "against" : "for",
          }))
        );
      }
    };

    fetchPreferences();
  }, [user]);

  const toggleTopic = (id: string, stance: "for" | "against") => {
    setSelectedTopicsWithStance((prev) => {
      const existing = prev.find((t) => t.id === id);
      if (!existing) {
        return [...prev, { id, stance }];
      }
      if (existing.stance === stance) {
        return prev.filter((t) => t.id !== id);
      }
      return prev.map((t) => (t.id === id ? { ...t, stance } : t));
    });
  };

  const handleSave = async () => {
    if (!user) return;

    const { error: prefError } = await supabase
      .from("user_match_preferences")
      .upsert({
        id: user.id,
        preferred_match_type: matchType,
        language,
        nationality,
      });

    if (prefError) {
      alert("Error saving match preferences: " + prefError.message);
      return;
    }

    await supabase
      .from("user_selected_topics")
      .delete()
      .eq("user_id", user.id);

    if (selectedTopicsWithStance.length > 0) {
      const inserts = selectedTopicsWithStance.map(({ id, stance }) => ({
        user_id: user.id,
        topic_id: id,
        stance,
      }));
      await supabase.from("user_selected_topics").insert(inserts);
    }

    alert("Preferences saved.");
  };

  if (!auth || !auth.user) {
    return <div className="text-text p-8">Please log in</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12">
          <div className="max-w-5xl mx-auto bg-surface rounded-3xl shadow-xl px-6 sm:px-10 py-10 space-y-10">
            <h1 className="text-4xl font-bold text-center">Match Preferences</h1>

            {/* Match Type */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Match Type</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["random", "opposite", "similar", "topic"].map((type) => (
                  <button
                    key={type}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-all ${
                      matchType === type
                        ? "bg-primary text-white border-primary"
                        : "bg-muted text-text border-secondaryText hover:border-primary"
                    }`}
                    onClick={() => setMatchType(type as any)}
                  >
                    {type === "random"
                      ? "Random"
                      : type === "opposite"
                      ? "Opposite"
                      : type === "similar"
                      ? "Similar"
                      : "Topic-Based"}
                  </button>
                ))}
              </div>
            </section>

            {/* Language */}
            <section>
              <label className="block mb-2 font-medium">Preferred Language</label>
              <input
                type="text"
                list="language-list"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="Choose your language"
                className="w-full p-3 border rounded-md bg-background text-text border-secondaryText"
              />
              <datalist id="language-list">
                {languages.map((lang) => (
                  <option key={lang} value={lang} />
                ))}
              </datalist>
            </section>

            {/* Nationality */}
            <section>
              <label className="block mb-2 font-medium">Preferred Nationality</label>
              <input
                type="text"
                list="nationality-list"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Choose your nationality"
                className="w-full p-3 border rounded-md bg-background text-text border-secondaryText"
              />
              <datalist id="nationality-list">
                {nationalities.map((nat) => (
                  <option key={nat} value={nat} />
                ))}
              </datalist>
            </section>

            {/* Topic Selection */}
            {matchType === "topic" && (
              <section className="pt-4">
                <h2 className="text-xl font-semibold mb-4">Select Topics</h2>
                <div className="border border-secondaryText rounded-lg bg-muted p-4 max-h-[400px] overflow-y-auto">
                  {topics.length === 0 ? (
                    <p className="text-sm italic text-tertiaryText">No topics available</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {topics.map((topic) => {
                        const selected = selectedTopicsWithStance.find((t) => t.id === topic.id);
                        return (
                          <div key={topic.id} className="flex flex-col bg-background p-3 rounded-lg shadow-sm border border-secondaryText">
                            <span className="text-sm font-medium mb-2">{topic.name}</span>
                            <div className="flex gap-2">
                              {["for", "against"].map((stance) => (
                                <button
                                  key={stance}
                                  onClick={() => toggleTopic(topic.id, stance as "for" | "against")}
                                  className={`px-3 py-1 text-xs rounded-full border font-medium transition ${
                                    selected?.stance === stance
                                      ? stance === "for"
                                        ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                                        : "bg-rose-600 text-white border-rose-700 hover:bg-rose-700"
                                      : "bg-muted text-text border-secondaryText hover:border-accent"
                                  }`}
                                >
                                  {stance}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Save + Find Buttons */}
            <div className="pt-4 flex justify-center gap-4">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-primary hover:bg-accent text-white rounded-md font-semibold transition"
              >
                Save Preferences
              </button>

              <button
                onClick={() => navigate("/chat")}
                className="px-6 py-3 bg-surface border border-primary text-primary hover:bg-primary hover:text-white rounded-md font-semibold transition"
              >
                Find Partner
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
