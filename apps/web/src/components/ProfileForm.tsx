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

export default function ProfileForm() {
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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
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
        setAvatarUrl(data.avatar_url || "");
        setTwitter(data.twitter || "");
        setLinkedin(data.linkedin || "");
        setGithub(data.github || "");
        setWebsite(data.website || "");
      }

      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileName = `${user.id}-${Date.now()}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setErrorMessage("Failed to upload image.");
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    setAvatarUrl(urlData.publicUrl);
  };

  const toggleBelief = (b: string) => {
    setBeliefs((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const toggleValue = (val: string) => {
    setSelectedValues((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
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
      avatar_url: avatarUrl,
      twitter,
      linkedin,
      github,
      website,
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
    <div className="min-h-screen flex flex-col bg-background text-text">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={auth?.signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-10">

            {/* Avatar */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-accent">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-accent text-lg">?</span>
                )}
              </div>
              <input type="file" onChange={handleAvatarUpload} className="block w-full text-sm" />
            </div>

            {/* Section: Basic Info */}
            <Section title="Basic Info">
              <TextInput label="Username" value={username} setValue={setUsername} />
              <TextInput label="Full Name" value={name} setValue={setName} />
              <TextArea label="Bio" value={bio} setValue={setBio} />
              <TextInput label="Nationality" value={nationality} setValue={setNationality} />
            </Section>

            {/* Section: Ideology */}
            <Section title="Ideology & Beliefs">
              <SelectInput label="Ideological Stance" value={stance} setValue={setStance} options={ideologies} />
              <TextArea label="Describe your ideology" value={ideologyDescription} setValue={setIdeologyDescription} />
              <RangeInput label="Belief Strength" value={beliefStrength} setValue={setBeliefStrength} />
              <CheckboxGroup label="Beliefs" items={beliefs} selected={selectedBeliefs} toggle={toggleBelief} />
              <CheckboxGroup label="Core Values" items={values} selected={selectedValues} toggle={toggleValue} />
            </Section>

            {/* Section: Personality */}
            <Section title="Personality">
              <TextInput label="MBTI Type" value={mbti} setValue={setMbti} />
              <SelectInput label="Conversation Style" value={conversationStyle} setValue={setConversationStyle} options={convoStyles} />
              <TextInput label="Influences" value={influences} setValue={setInfluences} />
            </Section>

            {/* Section: Social Links */}
            <Section title="Social Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput label="Twitter URL" value={twitter} setValue={setTwitter} />
                <TextInput label="LinkedIn URL" value={linkedin} setValue={setLinkedin} />
                <TextInput label="GitHub URL" value={github} setValue={setGithub} />
                <TextInput label="Website" value={website} setValue={setWebsite} />
              </div>
            </Section>

            {errorMessage && <div className="text-red-500 font-medium">{errorMessage}</div>}

            <button className="w-full bg-primary hover:bg-accent text-white font-bold py-3 rounded-lg" onClick={handleSubmit}>
              Save Profile
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function TextInput({ label, value, setValue }: { label: string; value: string; setValue: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input className="w-full p-3 border border-border bg-background rounded-md" value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

function TextArea({ label, value, setValue }: { label: string; value: string; setValue: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea className="w-full p-3 border border-border bg-background rounded-md" rows={3} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  );
}

function SelectInput({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select className="w-full p-3 border border-border bg-background rounded-md" value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">Select...</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function RangeInput({ label, value, setValue }: { label: string; value: number; setValue: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label} ({value}/10)</label>
      <input type="range" min={0} max={10} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function CheckboxGroup({ label, items, selected, toggle }: { label: string; items: string[]; selected: string[]; toggle: (val: string) => void }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2">
            <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
