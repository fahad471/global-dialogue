import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ChatRoom from '../components/ChatRoom';
import { useAuth } from '../context/AuthProvider';

export default function ChatPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    if (!user) return;
    const fetchPrefs = async () => {
      const { data } = await supabase
        .from('user_match_preferences')
        .select('*')
        .eq('id', user.id)
        .single();
      setPreferences(data);
    };
    fetchPrefs();
  }, [user]);

  if (!user) return <div>Please log in</div>;
  if (!preferences) return <div>Loading preferences...</div>;

  return <ChatRoom preferences={preferences} />;
}
