import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { supabase } from '../lib/supabaseClient';
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import { useTheme } from "../context/themeContext";

const wsUrl = import.meta.env.VITE_WS_URL;

type Props = {
  preferences?: any;
  signOut: () => Promise<void>;
};

export default function ChatRoom({ preferences, signOut }: Props) {
  const auth = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

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

  // Scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-12 overflow-y-auto flex flex-col">
          <section className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col space-y-4 transition-colors duration-300">
            <h2 className="text-3xl font-extrabold">Chat Room</h2>
            <p>Status: <span className={connected ? "text-green-500" : "text-red-500"}>{connected ? 'Connected' : 'Disconnected'}</span></p>

            {roomId ? (
              <>
                <p className="mb-4">Connected to: <span className="font-semibold">{peerEmail || peerId}</span></p>
                <div className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md p-4 overflow-y-auto h-80 bg-gray-50 dark:bg-gray-800">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400">No messages yet</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className="mb-2">
                        {msg}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <input
                  type="text"
                  className="mt-4 p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Type a message and press Enter"
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
              <p className="italic text-center text-gray-500 dark:text-gray-400">Waiting for match...</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
