import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useAuth } from '../context/AuthProvider';
import { useTopics } from '../hooks/useTopics';
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
    return <div>Please log in</div>;
  }
  const { user } = auth;

  if (!user) return <div>Please log in to edit your profile.</div>;
  const topics = useTopics();

  const [matchType, setMatchType] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      const { data: prefData, error: prefError } = await supabase
        .from('user_match_preferences')
        .select('preferred_match_type')
        .eq('id', user.id)
        .single();

      if (prefError) {
        console.error('Error fetching match preferences:', prefError);
      } else if (prefData) {
        setMatchType(prefData.preferred_match_type || '');
      }

      const { data: selectedTopics, error: selectedTopicsError } = await supabase
        .from('user_selected_topics')
        .select('topic_id')
        .eq('user_id', user.id);

      if (selectedTopicsError) {
        console.error('Error fetching selected topics:', selectedTopicsError);
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
      .from('user_match_preferences')
      .upsert({ id: user.id, preferred_match_type: matchType });

    if (prefError) {
      alert('Error saving match preferences: ' + prefError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from('user_selected_topics')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      alert('Error clearing selected topics: ' + deleteError.message);
      return;
    }

    if (selectedTopicIds.length > 0) {
      const inserts = selectedTopicIds.map((topic_id) => ({
        user_id: user.id,
        topic_id,
      }));

      const { error: insertError } = await supabase
        .from('user_selected_topics')
        .insert(inserts);

      if (insertError) {
        alert('Error saving selected topics: ' + insertError.message);
        return;
      }
    }

    alert('Preferences saved.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-smokyWhite dark:bg-jetBlack text-jetBlack dark:text-smokyWhite transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-12 overflow-y-auto">
          <section className="max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-12 transition-colors duration-300">
            <h1 className="text-4xl font-extrabold mb-6">Match Preferences</h1>

            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-xl font-semibold mb-2">Match Type</h2>
                <select
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
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

              <div>
                <h3 className="text-lg font-semibold mb-2">Topics</h3>
                <div className="flex flex-wrap gap-4">
                  {topics.map((topic) => (
                    <label key={topic.id} className="cursor-pointer flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTopicIds.includes(topic.id)}
                        onChange={() => toggleTopic(topic.id)}
                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span>{topic.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
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
