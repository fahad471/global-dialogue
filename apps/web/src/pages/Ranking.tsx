// frontend/src/pages/Ranking.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Ranking() {
  const [rankings, setRankings] = useState([]);
  const [topic, setTopic] = useState('climate change');
  const [stance, setStance] = useState('pro');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchRankings() {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_elo')
        .select('user_id, elo')
        .eq('topic', topic)
        .eq('stance', stance)
        .order('elo', { ascending: false });
      if (error) console.error(error);
      else setRankings(data || []);
      setLoading(false);
    }

    fetchRankings();
  }, [topic, stance]);

  return (
    <div>
      <h1>Ranking</h1>
      <label>
        Topic:
        <input value={topic} onChange={e => setTopic(e.target.value)} />
      </label>
      <label>
        Stance:
        <input value={stance} onChange={e => setStance(e.target.value)} />
      </label>
      {loading ? <p>Loading...</p> : (
        <ol>
          {rankings.map((user, idx) => (
            <li key={user.user_id}>
              User: {user.user_id} — Elo: {user.elo}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
