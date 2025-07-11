import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";

const ideologies = ["Conservative", "Socialist", "Centrist", "Anarchist"];
const beliefs = ["Pro-market", "Eco-conscious", "Humanist"];

interface ProfileFormProps {
  signOut: () => Promise<void>;
}

export default function ProfileForm({ signOut }: ProfileFormProps) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [nationality, setNationality] = useState("");
  const [stance, setStance] = useState("");
  const [selectedBeliefs, setBeliefs] = useState<string[]>([]);
  const [mbti, setMbti] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const user = auth?.user;

  // Load profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // ignore "No rows" error
        setErrorMessage("Error loading profile.");
      }

      if (data) {
        setUsername(data.username || "");
        setName(data.name || "");
        setBio(data.bio || "");
        setNationality(data.nationality || "");
        setStance(data.ideological_stance || "");
        setBeliefs(data.core_beliefs || []);
        setMbti(data.personality_type || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const toggleBelief = (b: string) => {
    setBeliefs((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  };

  const handleSubmit = async () => {
    setErrorMessage("");

    // Check if username already exists (excluding current user)
    const { data: existingUsers, error: usernameError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user?.id)
      .maybeSingle();

    if (usernameError) {
      setErrorMessage("Failed to check username uniqueness.");
      return;
    }

    if (existingUsers) {
      setErrorMessage("Username is already taken. Please choose another.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user?.id,
      username,
      name,
      bio,
      nationality,
      ideological_stance: stance,
      core_beliefs: selectedBeliefs,
      personality_type: mbti,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      alert("Profile saved.");
    }
  };

  if (!user) return <div className="text-text p-8">Please log in</div>;
  if (loading) return <div className="text-text p-8">Loading profile...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-12 overflow-y-auto">
          <section className="max-w-3xl mx-auto bg-surface rounded-3xl shadow-2xl p-10 transition-colors duration-300">
            <h1 className="text-4xl font-extrabold mb-8 text-center">Edit Profile</h1>

            <div className="space-y-6">
              {errorMessage && (
                <div className="text-red-500 font-medium">{errorMessage}</div>
              )}

              {/* Username */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Username</label>
                <input
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="e.g. johndoe123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Full Name</label>
                <input
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Bio</label>
                <textarea
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="A short bio about you"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Nationality</label>
                <input
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="e.g. Canadian"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>

              {/* Ideological Stance */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Ideological Stance</label>
                <select
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  value={stance}
                  onChange={(e) => setStance(e.target.value)}
                >
                  <option value="">Select ideology</option>
                  {ideologies.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              {/* Core Beliefs */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Core Beliefs</label>
                <div className="flex flex-wrap gap-4">
                  {beliefs.map((b) => (
                    <label key={b} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBeliefs.includes(b)}
                        onChange={() => toggleBelief(b)}
                        className="rounded border-secondaryText bg-background text-accent"
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* MBTI Type */}
              <div>
                <label className="block mb-2 font-semibold text-lg">MBTI Type</label>
                <input
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="e.g. INTP"
                  value={mbti}
                  onChange={(e) => setMbti(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button
                className="w-full py-3 bg-primary hover:bg-accent text-text font-semibold rounded-lg transition"
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
