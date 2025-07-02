// import { useState, useEffect } from 'react';
// import { supabase } from "../lib/supabaseClient";
// import { useAuth } from '../context/AuthProvider';
// import { useTopics } from '../hooks/useTopics';

// export default function MatchPreferences() {
//   const { user } = useAuth();
//   const topics = useTopics();

//   const [matchType, setMatchType] = useState('');
//   const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

//   useEffect(() => {
//     const fetchPreferences = async () => {
//       const { data } = await supabase
//         .from('user_match_preferences')
//         .select('*')
//         .eq('id', user.id)
//         .single();

//       if (data) {
//         setMatchType(data.preferred_match_type || '');
//         setSelectedTopicIds(data.selected_topics || []);
//       }
//     };
//     if (user) fetchPreferences();
//   }, [user]);

//   const toggleTopic = (id: string) => {
//     setSelectedTopicIds((prev) =>
//       prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
//     );
//   };

//   const handleSave = async () => {
//     const { error } = await supabase.from('user_match_preferences').upsert({
//       id: user.id,
//       preferred_match_type: matchType,
//       selected_topics: selectedTopicIds,
//     });

//     if (error) alert(error.message);
//     else alert('Preferences saved.');
//   };

//   return (
//     <div className="space-y-4">
//       <h2 className="text-xl font-semibold">Match Type</h2>
//       <select value={matchType} onChange={(e) => setMatchType(e.target.value)}>
//         <option value="">Select preference</option>
//         <option value="similar">Similar Views</option>
//         <option value="opposite">Opposing Views</option>
//         <option value="random">Random Match</option>
//         <option value="topic">Topic-based</option>
//       </select>

//       <h3 className="text-lg font-semibold">Topics</h3>
//       <div className="flex flex-wrap gap-2">
//         {topics.map((topic) => (
//           <label key={topic.id} className="cursor-pointer">
//             <input
//               type="checkbox"
//               checked={selectedTopicIds.includes(topic.id)}
//               onChange={() => toggleTopic(topic.id)}
//             />
//             <span className="ml-2">{topic.name}</span>
//           </label>
//         ))}
//       </div>

//       <button
//         className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
//         onClick={handleSave}
//       >
//         Save Preferences
//       </button>
//     </div>
//   );
// }
import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useAuth } from '../context/AuthProvider';
import { useTopics } from '../hooks/useTopics';

export default function MatchPreferences() {
  const { user } = useAuth();
  if (!user) return <div>Please log in to edit your profile.</div>;
  const topics = useTopics();

  const [matchType, setMatchType] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      // Fetch preferred_match_type from user_match_preferences
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

      // Fetch selected topic IDs from user_selected_topics
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

    // Upsert preferred_match_type in user_match_preferences
    const { error: prefError } = await supabase
      .from('user_match_preferences')
      .upsert({ id: user.id, preferred_match_type: matchType });

    if (prefError) {
      alert('Error saving match preferences: ' + prefError.message);
      return;
    }

    // Delete all current user_selected_topics for this user
    const { error: deleteError } = await supabase
      .from('user_selected_topics')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      alert('Error clearing selected topics: ' + deleteError.message);
      return;
    }

    // Insert new selected topics
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
