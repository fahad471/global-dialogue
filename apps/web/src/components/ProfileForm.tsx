import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";

const ideologies = ["Conservative", "Socialist", "Centrist", "Anarchist"];
const beliefs = ["Pro-market", "Eco-conscious", "Humanist"];
const values = ["Freedom", "Equality", "Tradition", "Innovation", "Spirituality", "Security"];
const convoStyles = ["Curious", "Challenging", "Collaborative", "Analytical"];

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
  const [ideologyDescription, setIdeologyDescription] = useState("");
  const [selectedBeliefs, setBeliefs] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [beliefStrength, setBeliefStrength] = useState(5);
  const [mbti, setMbti] = useState("");
  const [conversationStyle, setConversationStyle] = useState("");
  const [influences, setInfluences] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const user = auth?.user;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        setErrorMessage("Error loading profile.");
      }

      if (data) {
        setUsername(data.username || "");
        setName(data.name || "");
        setBio(data.bio || "");
        setNationality(data.nationality || "");
        setStance(data.ideological_stance || "");
        setIdeologyDescription(data.ideology_description || "");
        setBeliefs(data.core_beliefs || []);
        setSelectedValues(data.core_values || []);
        setBeliefStrength(data.belief_strength || 5);
        setMbti(data.personality_type || "");
        setConversationStyle(data.conversation_style || "");
        setInfluences(data.influences || "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const toggleBelief = (b: string) => {
    setBeliefs((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const toggleValue = (val: string) => {
    setSelectedValues((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleSubmit = async () => {
    setErrorMessage("");

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
      ideology_description: ideologyDescription,
      core_beliefs: selectedBeliefs,
      core_values: selectedValues,
      belief_strength: beliefStrength,
      personality_type: mbti,
      conversation_style: conversationStyle,
      influences,
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
          <section className="max-w-3xl mx-auto bg-surface rounded-3xl shadow-2xl p-10">
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

              {/* Ideology Description */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Describe Your Ideology</label>
                <textarea
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="What does your ideology mean to you?"
                  value={ideologyDescription}
                  onChange={(e) => setIdeologyDescription(e.target.value)}
                  rows={3}
                />
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

              {/* Belief Strength */}
              <div>
                <label className="block mb-2 font-semibold text-lg">
                  How Strongly Do You Hold Your Beliefs?
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={beliefStrength}
                  onChange={(e) => setBeliefStrength(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="mt-1 text-sm text-secondaryText">
                  {beliefStrength === 0
                    ? "Very open-minded / questioning"
                    : beliefStrength === 10
                    ? "Strongly committed"
                    : `Strength: ${beliefStrength}/10`}
                </p>
              </div>

              {/* Core Values */}
              <div>
                <label className="block mb-2 font-semibold text-lg">What Values Matter Most?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {values.map((val) => (
                    <label key={val} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(val)}
                        onChange={() => toggleValue(val)}
                        className="rounded border-secondaryText bg-background text-accent"
                      />
                      <span>{val}</span>
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

              {/* Conversation Style */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Conversation Style</label>
                <select
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  value={conversationStyle}
                  onChange={(e) => setConversationStyle(e.target.value)}
                >
                  <option value="">Select style</option>
                  {convoStyles.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Influences */}
              <div>
                <label className="block mb-2 font-semibold text-lg">Influential Thinkers or Works</label>
                <input
                  className="w-full p-3 border rounded-md bg-background border-secondaryText text-text"
                  placeholder="e.g. Marx, Hayek, Bell Hooks"
                  value={influences}
                  onChange={(e) => setInfluences(e.target.value)}
                />
              </div>

              {/* Submit */}
              <button
                className="w-full py-3 bg-primary hover:bg-accent text-text font-semibold rounded-lg transition"
                onClick={handleSubmit}
              >
                Save Profile
              </button>

              {/* Summary Preview */}
              <div className="mt-10 p-6 bg-muted border rounded-xl">
                <h2 className="text-xl font-semibold mb-4">Profile Preview</h2>
                <p>
                  <strong>{name || "Unnamed user"}</strong> identifies as a{" "}
                  <strong>{stance}</strong> ({mbti}) and values{" "}
                  {selectedValues.length > 0 ? selectedValues.join(", ") : "n/a"}.
                </p>
                <p>
                  They describe their ideology as:{" "}
                  <em>{ideologyDescription || "No description provided."}</em>
                </p>
                <p>
                  Belief Strength: <strong>{beliefStrength}/10</strong>
                </p>
                <p>
                  Conversation Style: <strong>{conversationStyle || "Not set"}</strong>
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
