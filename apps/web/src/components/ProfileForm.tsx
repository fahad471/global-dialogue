import { useState } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useAuth } from '../context/AuthProvider';
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";

const ideologies = ["Conservative", "Socialist", "Centrist", "Anarchist"];
const beliefs = ["Pro-market", "Eco-conscious", "Transhumanist"];

interface ProfileFormProps {
  signOut: () => Promise<void>;
}

export default function ProfileForm({ signOut }: ProfileFormProps) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen flex flex-col bg-smokyWhite dark:bg-jetBlack text-jetBlack dark:text-smokyWhite transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-12 overflow-y-auto">
          <section className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 transition-colors duration-300">
            <h1 className="text-4xl font-extrabold mb-8 text-center">Edit Profile</h1>

            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-semibold text-lg">Ideological Stance</label>
                <select
                  className="w-full p-3 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  value={stance}
                  onChange={(e) => setStance(e.target.value)}
                >
                  <option value="">Select ideology</option>
                  {ideologies.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-lg">Core Beliefs</label>
                <div className="flex flex-wrap gap-4">
                  {beliefs.map((b) => (
                    <label key={b} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBeliefs.includes(b)}
                        onChange={() => toggleBelief(b)}
                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-lg">MBTI Type</label>
                <input
                  className="w-full p-3 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                  placeholder="MBTI Type (e.g. INTP)"
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value)}
                />
              </div>

              <button
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                onClick={handleSubmit}
              >
                Save Profile
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
