import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthProvider";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";
import type { JSX } from "react";



type ProfileForm = {
  username: string;
  name: string;
  bio: string;
  nationality: string;
  ideological_stance: string;
  ideology_description: string;
  core_beliefs: string[];
  core_values: string[];
  belief_strength: number;
  personality_type: string;
  conversation_style: string;
  influences: string;
  avatar_url: string;
  twitter: string;
  linkedin: string;
  github: string;
  website: string;
  gender_identity: string;
  age_range: string;
  language: string[];
  timezone: string;
  worldview: string;
  religious_affiliation: string;
  philosophical_alignment: string;
  political_alignment: string;
  economic_view: string;
  big5_openness: number;
  big5_conscientiousness: number;
  big5_extraversion: number;
  big5_agreeableness: number;
  big5_neuroticism: number;
  cognitive_style: string;
  learning_style: string;
  decision_style: string;
  conflict_response: string;
  communication_preference: string;
  debate_style: string;
  listening_style: string;
  fields_of_interest: string[];
  preferred_media: string[];
  favorite_thinkers: string[];
  life_motivation: string;
  personal_goals: string[];
  risk_tolerance: string;
  change_adaptability: string;
};

const convoStyles = ["Curious", "Challenging", "Collaborative", "Analytical"];
const genders = ["male", "female", "nonbinary", "trans", "other"];
const ageRanges = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_64", "65_plus"];
const worldviews = ["scientific", "spiritual", "agnostic", "religious", "skeptical", "materialist"];
const religions = ["atheist", "agnostic", "christian", "muslim", "hindu", "buddhist", "jewish", "spiritual", "other"];
const philosophies = ["stoic", "existentialist", "nihilist", "pragmatist", "utilitarian", "absurdist", "none", "other"];
const politics = ["left", "center", "right", "anarchist", "authoritarian", "libertarian"];
const economics = ["capitalist", "socialist", "mixed", "communist", "anarchist"];
const styles = ["intuitive", "analytical", "emotional", "balanced"];
const learnStyles = ["visual", "auditory", "kinesthetic", "reading_writing"];
const decisionStyles = ["rational", "gut_feeling", "risk_averse", "risk_taker"];
const conflictResponses = ["avoidant", "confrontational", "collaborative", "passive_aggressive"];
const commPrefs = ["written", "spoken", "nonverbal"];
const debateStyles = ["competitive", "cooperative", "passive"];
const listeningStyles = ["active", "reflective", "selective", "passive"];
const lifeMotivations = ["achievement", "curiosity", "love", "freedom", "recognition", "peace"];
const riskTolerances = ["low", "medium", "high"];
const changeAdaptabilities = ["resistant", "neutral", "adaptive"];
// const preferredMedias = ["books", "videos", "podcasts", "articles", "lectures"];

export default function ProfileFormExpanded() {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const user = auth?.user;

const [form, setForm] = useState<ProfileForm>({
  username: "",
  name: "",
  bio: "",
  nationality: "",
  ideological_stance: "",
  ideology_description: "",
  core_beliefs: [],
  core_values: [],
  belief_strength: 5,
  personality_type: "",
  conversation_style: "",
  influences: "",
  avatar_url: "",
  twitter: "",
  linkedin: "",
  github: "",
  website: "",
  gender_identity: "",
  age_range: "",
  language: [],
  timezone: "",
  worldview: "",
  religious_affiliation: "",
  philosophical_alignment: "",
  political_alignment: "",
  economic_view: "",
  big5_openness: 50,
  big5_conscientiousness: 50,
  big5_extraversion: 50,
  big5_agreeableness: 50,
  big5_neuroticism: 50,
  cognitive_style: "",
  learning_style: "",
  decision_style: "",
  conflict_response: "",
  communication_preference: "",
  debate_style: "",
  listening_style: "",
  fields_of_interest: [],
  preferred_media: [],
  favorite_thinkers: [],
  life_motivation: "",
  personal_goals: [],
  risk_tolerance: "",
  change_adaptability: "",
});


  // Required fields for completeness calculation and marking *
  const requiredFields = [
    "username",
    "name",
    "bio",
    "nationality",
    "ideological_stance",
    "personality_type",
    "gender_identity",
    "age_range",
    "language",
    "life_motivation",
  ];

  // Utility to check if a field is filled
  const isFieldFilled = (field: keyof ProfileForm) => {
    const val = form[field];
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number") return val !== 0 && val !== null;
    return Boolean(val);
  };

  // Calculate filled required fields count
  const filledCount = requiredFields.reduce((count, field) => isFieldFilled(field as keyof ProfileForm) ? count + 1 : count, 0);
  const completenessPercent = Math.round((filledCount / requiredFields.length) * 100);

  // Convert array fields stored as string (comma separated) to arrays on load
  const parseArrayFields = (data: any) => {
    const arrFields = [
      "core_beliefs",
      "core_values",
      "language",
      "fields_of_interest",
      "preferred_media",
      "favorite_thinkers",
      "personal_goals",
    ];
    const parsed = { ...data };
    arrFields.forEach((field) => {
      if (data[field]) {
        if (Array.isArray(data[field])) {
          parsed[field] = data[field];
        } else if (typeof data[field] === "string") {
          parsed[field] = data[field].split(",").map((s) => s.trim());
        } else {
          parsed[field] = [];
        }
      }
    });
    return parsed;
  };

  // Convert arrays to comma separated strings on save
  const prepareArrayFieldsForSave = (formData: any) => {
    const arrFields = [
      "core_beliefs",
      "core_values",
      "language",
      "fields_of_interest",
      "preferred_media",
      "favorite_thinkers",
      "personal_goals",
    ];
    const prepared = { ...formData };
    arrFields.forEach((field) => {
      if (!Array.isArray(formData[field])) {
        if (typeof formData[field] === "string") {
          prepared[field] = formData[field].split(",").map((s) => s.trim());
        } else {
          prepared[field] = [];
        }
      }
    });
    return prepared;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) setForm((prev) => ({ ...prev, ...parseArrayFields(data) }));
    };
    fetchProfile();
  }, [user]);

  const handleChange = (field: keyof ProfileForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Special handler for array fields input as comma separated strings
  const handleArrayChange = (field: keyof ProfileForm, value: string) => {
    const arr = value.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    setForm((prev) => ({ ...prev, [field]: arr }));
  };

  const handleSubmit = async () => {
    const payload = prepareArrayFieldsForSave(form);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...payload });
    if (error) alert("Error saving profile: " + error.message);
    else alert("Profile saved");
  };

  // Render label with * if required
  const renderLabel = (label: string, field: keyof ProfileForm) => (
    <label className="block text-sm font-medium mb-1 text-secondaryText">
      {label} {requiredFields.includes(field) && <span className="text-red-500">*</span>}
    </label>
  );

  const renderSelect = (
  label: string,
  field: keyof ProfileForm,
  options: string[]
) => (
    <div className="mb-4">
      {renderLabel(label, field)}
      <select
        className="w-full px-4 py-3 bg-surface border border-border text-text rounded-md"
        value={form[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );

  const renderTextInput = (label: string, field: keyof ProfileForm) => (
    <div className="mb-4">
      {renderLabel(label, field)}
      <input
        type="text"
        className="w-full px-4 py-3 bg-surface border border-border text-text rounded-md"
        value={form[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
      />
    </div>
  );

  const renderTextArea = (label: string, field: keyof ProfileForm) => (
    <div className="mb-4">
      {renderLabel(label, field)}
      <textarea
        rows={3}
        className="w-full px-4 py-3 bg-surface border border-border text-text rounded-md"
        value={form[field] || ""}
        onChange={(e) => handleChange(field, e.target.value)}
      />
    </div>
  );

  const renderRangeInput = (label: string, field: keyof ProfileForm) => (
    <div className="mb-4">
      {renderLabel(label, field)}
      <label className="block text-sm mb-1 text-secondaryText">
        ({form[field]}/100)
      </label>
      <input
        type="range"
        min={0}
        max={100}
        className="w-full"
        value={form[field]}
        onChange={(e) => handleChange(field, parseInt(e.target.value))}
      />
    </div>
  );

  const renderArrayInput = (label: string, field: keyof ProfileForm) => (
    <div className="mb-4">
      {renderLabel(label, field)}
      <input
        type="text"
        className="w-full px-4 py-3 bg-surface border border-border text-text rounded-md"
        value={
  Array.isArray(form[field]) ? form[field].join(", ") : String(form[field] ?? "")
}

        onChange={(e) => handleArrayChange(field, e.target.value)}
      />
    </div>
  );

  // Step state and helpers
  const [step, setStep] = useState(1);

  const maxStep = 7;

  const canGoNext = step < maxStep;
  const canGoBack = step > 1;

  // Break fields into steps/categories:
  const stepFields: Record<number, JSX.Element> = {
    1: (
      <>
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        {renderTextInput("Username", "username")}
        {renderTextInput("Name", "name")}
        {renderTextArea("Bio", "bio")}
        {renderTextInput("Nationality", "nationality")}
      </>
    ),
    2: (
      <>
        <h2 className="text-xl font-semibold mb-4">Ideology & Personality</h2>
        {renderTextInput("Ideological Stance", "ideological_stance")}
        {renderTextArea("Ideology Description", "ideology_description")}
        {renderArrayInput("Core Beliefs", "core_beliefs")}
        {renderArrayInput("Core Values", "core_values")}
        {renderRangeInput("Belief Strength", "belief_strength")}
        {renderTextInput("Personality Type", "personality_type")}
        {renderSelect("Conversation Style", "conversation_style", convoStyles)}
        {renderTextInput("Influences", "influences")}
      </>
    ),
    3: (
      <>
        <h2 className="text-xl font-semibold mb-4">Social & Online</h2>
        {renderTextInput("Avatar URL", "avatar_url")}
        {renderTextInput("Twitter", "twitter")}
        {renderTextInput("LinkedIn", "linkedin")}
        {renderTextInput("GitHub", "github")}
        {renderTextInput("Website", "website")}
      </>
    ),
    4: (
      <>
        <h2 className="text-xl font-semibold mb-4">Demographics</h2>
        {renderSelect("Gender Identity", "gender_identity", genders)}
        {renderSelect("Age Range", "age_range", ageRanges)}
        {renderArrayInput("Languages", "language")}
        {renderTextInput("Timezone", "timezone")}
      </>
    ),
    5: (
      <>
        <h2 className="text-xl font-semibold mb-4">Worldview & Beliefs</h2>
        {renderSelect("Worldview", "worldview", worldviews)}
        {renderSelect("Religious Affiliation", "religious_affiliation", religions)}
        {renderSelect("Philosophical Alignment", "philosophical_alignment", philosophies)}
        {renderSelect("Political Alignment", "political_alignment", politics)}
        {renderSelect("Economic View", "economic_view", economics)}
      </>
    ),
    6: (
      <>
        <h2 className="text-xl font-semibold mb-4">Personality Traits</h2>
        {renderRangeInput("Big5 Openness", "big5_openness")}
        {renderRangeInput("Big5 Conscientiousness", "big5_conscientiousness")}
        {renderRangeInput("Big5 Extraversion", "big5_extraversion")}
        {renderRangeInput("Big5 Agreeableness", "big5_agreeableness")}
        {renderRangeInput("Big5 Neuroticism", "big5_neuroticism")}
        {renderSelect("Cognitive Style", "cognitive_style", styles)}
        {renderSelect("Learning Style", "learning_style", learnStyles)}
        {renderSelect("Decision Style", "decision_style", decisionStyles)}
        {renderSelect("Conflict Response", "conflict_response", conflictResponses)}
        {renderSelect("Communication Preference", "communication_preference", commPrefs)}
        {renderSelect("Debate Style", "debate_style", debateStyles)}
        {renderSelect("Listening Style", "listening_style", listeningStyles)}
      </>
    ),
    7: (
      <>
        <h2 className="text-xl font-semibold mb-4">Interests & Motivation</h2>
        {renderArrayInput("Fields of Interest", "fields_of_interest")}
        {renderArrayInput("Preferred Media", "preferred_media")}
        {renderArrayInput("Favorite Thinkers", "favorite_thinkers")}
        {renderSelect("Life Motivation", "life_motivation", lifeMotivations)}
        {renderArrayInput("Personal Goals", "personal_goals")}
        {renderSelect("Risk Tolerance", "risk_tolerance", riskTolerances)}
        {renderSelect("Change Adaptability", "change_adaptability", changeAdaptabilities)}
      </>
    ),
  };

  const renderCurrentStep = () => stepFields[step];

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={auth?.signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto bg-surfaceAlt max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Profile Form</h1>
          <div className="mb-6">
            <div className="text-sm mb-1">
              Profile completeness: <strong>{completenessPercent}%</strong>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === maxStep) {
                handleSubmit();
              } else {
                setStep(step + 1);
              }
            }}
          >
            {renderCurrentStep()}

            <div className="flex justify-between mt-6">
              <button
                type="button"
                disabled={!canGoBack}
                className={`px-6 py-3 rounded-md font-semibold border ${
                  canGoBack
                    ? "bg-secondary text-text border-border hover:bg-secondaryHover"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canGoBack && setStep(step - 1)}
              >
                Previous
              </button>

              {canGoNext ? (
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary border border-primary text-white hover:bg-primaryHover rounded-md font-semibold transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary border border-primary text-white hover:bg-primaryHover rounded-md font-semibold transition"
                >
                  Save Profile
                </button>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
