import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useAuth } from '../context/AuthProvider';
import { useTopics } from '../hooks/useTopics';

export default function MatchPreferences() {
  const { user } = useAuth();
  const topics = useTopics();

  const [matchType, setMatchType] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data } = await supabase
        .from('user_match_preferences')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setMatchType(data.preferred_match_type || '');
        setSelectedTopicIds(data.selected_topics || []);
      }
    };
    if (user) fetchPreferences();
  }, [user]);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const { error } = await supabase.from('user_match_preferences').upsert({
      id: user.id,
      preferred_match_type: matchType,
      selected_topics: selectedTopicIds,
    });

    if (error) alert(error.message);
    else alert('Preferences saved.');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Match Type</h2>
      <select value={matchType} onChange={(e) => setMatchType(e.target.value)}>
        <option value="">Select preference</option>
        <option value="similar">Similar Views</option>
        <option value="opposite">Opposing Views</option>
        <option value="random">Random Match</option>
        <option value="topic">Topic-based</option>
      </select>

      <h3 className="text-lg font-semibold">Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <label key={topic.id} className="cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTopicIds.includes(topic.id)}
              onChange={() => toggleTopic(topic.id)}
            />
            <span className="ml-2">{topic.name}</span>
          </label>
        ))}
      </div>

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleSave}
      >
        Save Preferences
      </button>
    </div>
  );
}
