import MatchPreferences from '../components/MatchPreferences';

export default function PreferencesPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Dialogue Preferences</h1>
      <MatchPreferences />
    </div>
  );
}
