import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";
import { useTopics } from "../hooks/useTopics";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";

interface MatchPreferencesProps {
  signOut: () => Promise<void>;
}

export default function MatchPreferences({ signOut }: MatchPreferencesProps) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!auth || !auth.user) {
    return <div className="text-text p-8">Please log in</div>;
  }

  const { user } = auth;
  const topics = useTopics();

  const [matchType, setMatchType] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [nationality, setNationality] = useState("");

  const languages = [
    "None","English", "Spanish", "French", "German", "Chinese", "Arabic", "Hindi", "Portuguese", "Russian", "Japanese"
  ];

  const nationalities = [
    "American", "Canadian", "British", "French", "German", "Indian", "Chinese", "Brazilian", "Nigerian", "Australian"
  ];

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data: prefData, error: prefError } = await supabase
        .from("user_match_preferences")
        .select("preferred_match_type, language, nationality")
        .eq("id", user.id)
        .single();

      if (prefError) {
        console.error("Error fetching match preferences:", prefError);
      } else if (prefData) {
        setMatchType(prefData.preferred_match_type || "");
        setLanguage(prefData.language || "");
        setNationality(prefData.nationality || "");
      }

      const { data: selectedTopics, error: selectedTopicsError } = await supabase
        .from("user_selected_topics")
        .select("topic_id")
        .eq("user_id", user.id);

      if (selectedTopicsError) {
        console.error("Error fetching selected topics:", selectedTopicsError);
      } else if (selectedTopics) {
        setSelectedTopicIds(selectedTopics.map((t) => t.topic_id));
      }
    };

    fetchPreferences();
  }, [user]);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
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

    const { error: deleteError } = await supabase
      .from("user_selected_topics")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      alert("Error clearing selected topics: " + deleteError.message);
      return;
    }

    if (selectedTopicIds.length > 0) {
      const inserts = selectedTopicIds.map((topic_id) => ({
        user_id: user.id,
        topic_id,
      }));

      const { error: insertError } = await supabase
        .from("user_selected_topics")
        .insert(inserts);

      if (insertError) {
        alert("Error saving selected topics: " + insertError.message);
        return;
      }
    }

    alert("Preferences saved.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-12 overflow-y-auto">
          <section className="max-w-5xl mx-auto bg-surface rounded-3xl shadow-2xl p-12 transition-colors duration-300">
            <h1 className="text-4xl font-extrabold mb-6 text-center">Match Preferences</h1>

            <div className="space-y-6 text-left">

              {/* Match Type */}
              <div>
                <label className="text-xl font-semibold mb-2 block">Match Type</label>
                <select
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                >
                  <option value="">Select preference</option>
                  <option value="similar">Similar Views</option>
                  <option value="opposite">Opposing Views</option>
                  <option value="random">Random Match</option>
                  <option value="topic">Topic-based</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="text-xl font-semibold mb-2 block">Language</label>
                <input
                  type="text"
                  list="language-list"
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="e.g., English"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
                <datalist id="language-list">
                  {languages.map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>
              </div>

              {/* Nationality */}
              <div>
                <label className="text-xl font-semibold mb-2 block">Nationality</label>
                <input
                  type="text"
                  list="nationality-list"
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="e.g., Canadian"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
                <datalist id="nationality-list">
                  {nationalities.map((nat) => (
                    <option key={nat} value={nat} />
                  ))}
                </datalist>
              </div>

              {/* Topics */}
              <div>
                <label className="text-xl font-semibold mb-2 block">Topics</label>
                <div className="flex flex-wrap gap-4">
                  {topics.map((topic) => (
                    <label key={topic.id} className="cursor-pointer flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTopicIds.includes(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="rounded border-secondaryText bg-background text-accent"
                      />
                      <span>{topic.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                className="mt-4 px-6 py-3 bg-primary hover:bg-accent text-text font-semibold rounded-lg transition"
                onClick={handleSave}
              >
                Save Preferences
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
