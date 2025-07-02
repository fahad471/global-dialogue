import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your actual keys or import from your utils)
const supabaseUrl = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const wsUrl = import.meta.env.VITE_WS_URL;

type Props = {
  preferences?: any;
};

export default function ChatRoom({ preferences }: Props) {
  const auth = useAuth();
  if (!auth || !auth.user) {
    return <div>Please log in</div>;
  }
  const { user } = auth;
  const [input, setInput] = useState('');
  const { connected, messages, sendMessage, peerId, roomId } = useWebSocket(
    wsUrl,
    user?.id || '',
    preferences || {}
  );

  const [peerEmail, setPeerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!peerId) {
      setPeerEmail(null);
      return;
    }

    async function fetchPeerEmail() {
      const { data, error } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', peerId)
        .single();

      if (error) {
        console.error('Error fetching peer email:', error);
        setPeerEmail(null);
      } else {
        setPeerEmail(data.email);
      }
    }

    fetchPeerEmail();
  }, [peerId]);

  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h2>Chat Room</h2>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {roomId ? (
        <>
          <p>Connected to: {peerEmail || peerId}</p>
          <div
            style={{ border: '1px solid gray', height: 300, overflowY: 'auto' }}
          >
            {messages.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim()) {
                sendMessage(input.trim());
                setInput('');
              }
            }}
          />
        </>
      ) : (
        <p>Waiting for match...</p>
      )}
    </div>
  );
}
