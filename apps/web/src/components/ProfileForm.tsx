import { useState } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useAuth } from '../context/AuthProvider';

const ideologies = ["Conservative", "Socialist", "Centrist", "Anarchist"];
const beliefs = ["Pro-market", "Eco-conscious", "Transhumanist"];

export default function ProfileForm() {
  const auth = useAuth();
  if (!auth || !auth.user) {
    return <div>Please log in</div>;
  }
  const { user } = auth;

  const [stance, setStance] = useState('');
  const [selectedBeliefs, setBeliefs] = useState<string[]>([]);
  const [mbti, setMbti] = useState('');

  const toggleBelief = (b: string) => {
    setBeliefs((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ideological_stance: stance,
      core_beliefs: selectedBeliefs,
      personality_type: mbti,
    });

    if (error) alert(error.message);
    else alert("Profile saved.");
  };

  return (
    <div>
      <h2>Edit Profile</h2>
      <select onChange={(e) => setStance(e.target.value)} value={stance}>
        <option value="">Select ideology</option>
        {ideologies.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>

      <div>
        {beliefs.map((b) => (
          <label key={b}>
            <input
              type="checkbox"
              checked={selectedBeliefs.includes(b)}
              onChange={() => toggleBelief(b)}
            />
            {b}
          </label>
        ))}
      </div>

      <input
        placeholder="MBTI Type (e.g. INTP)"
        value={mbti}
        onChange={(e) => setMbti(e.target.value)}
      />
      <button onClick={handleSubmit}>Save Profile</button>
    </div>
  );
}
