import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTheme } from '../context/themeContext';
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import VideoTile from "./VideoTile";
import ControlsBar from "./ControlsBar";

const wsUrl = import.meta.env.VITE_WS_URL;

type Props = {
  preferences?: any;
  signOut: () => Promise<void>;
};

type Message = {
  sender: string;
  text: string;
  timestamp: string;
  fact_check?: boolean;
  toxicity?: number;
  hate_speech?: boolean;
  rating?: number;
  reasoning?: string;
};

export default function ChatRoom({ preferences, signOut }: Props) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const {
    connected,
    messages,
    sendMessage,
    peerUsername,
    roomId,
    localStream,
    remoteStream,
    peerConnection
  } = useWebSocket(wsUrl, auth?.user?.id || '', preferences || {});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    try {
const formatted = messages.map((msgStr: string) => {
  const msg = JSON.parse(msgStr);
  return {
    sender: msg.sender || peerUsername || "Peer",
    text: msg.text || "",
    timestamp: msg.timestamp || new Date().toISOString(),
    fact_check: msg.fact_check,
    toxicity: msg.toxicity,
    hate_speech: msg.hate_speech,
    rating: msg.rating,
    reasoning: msg.reasoning,
  };
});
      setChatMessages(formatted);
    } catch {
      const formatted = messages.map((msg: string) => ({
        sender: peerUsername || "Peer",
        text: msg,
        timestamp: new Date().toISOString(),
      }));
      setChatMessages(formatted);
    }
  }, [messages]);

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    setVideoOn(!videoOn);
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
      sender?.replaceTrack(screenTrack);

      screenTrack.onended = () => {
        const originalTrack = localStream?.getVideoTracks()[0];
        if (originalTrack) {
          sender?.replaceTrack(originalTrack);
        }
      };
    } catch (err) {
      console.error("Screen sharing failed:", err);
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    window.location.reload();
  };

  if (!auth?.user) return <div>Please log in</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-6 md:p-12 overflow-y-auto flex flex-col space-y-6">
          <section className="max-w-5xl mx-auto bg-surface rounded-3xl shadow-2xl p-6 space-y-6 transition-colors duration-300">
            <h2 className="text-3xl font-bold">Chat Room</h2>
            <p>Status: <span className={connected ? "text-success" : "text-error"}>{connected ? 'Connected' : 'Disconnected'}</span></p>

            {roomId ? (
              <>
                <p>Connected to: <span className="font-semibold">{peerUsername || 'Peer'}</span></p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VideoTile name="You" stream={localStream} muted />
                  <VideoTile name={peerUsername || 'Peer'} stream={remoteStream} />
                </div>

                <ControlsBar
                  micOn={micOn}
                  videoOn={videoOn}
                  onToggleMic={toggleMic}
                  onToggleVideo={toggleVideo}
                  onEndCall={endCall}
                  onShareScreen={shareScreen}
                />

                <div className="border border-secondaryText rounded-md p-4 overflow-y-auto h-40 bg-muted flex flex-col space-y-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-tertiaryText">No messages yet</p>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isOwnMessage = msg.sender === auth?.user?.id;
                      return (
                        <div
                          key={i}
className={`text-sm rounded-lg px-3 py-2 w-full max-w-2xl bg-primary/10 dark:bg-primary/20`}

                        >
                          {!isOwnMessage && (
                            <div className="font-semibold">{peerUsername || msg.sender}</div>
                          )}
                          {isOwnMessage && (
                            <div className="font-semibold">You</div>
                          )}
                          <div>{msg.text}</div>
                          <div className="text-xs text-secondaryText">{new Date(msg.timestamp).toLocaleTimeString()}</div>

                          {msg.fact_check !== undefined && (
                            <div className="text-xs mt-1 text-gray-500">
                              <div>Fact Check: {msg.fact_check ? '✔️ Accurate' : '❌ Inaccurate'}</div>
                              <div>Toxicity: {(msg.toxicity ?? 0).toFixed(2)}</div>
                              <div>Hate Speech: {msg.hate_speech ? '🚫 Yes' : 'No'}</div>
                              <div>Debate Rating: {msg.rating ?? 'N/A'} / 10</div>
                              <div className="italic">Reason: {msg.reasoning}</div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <input
                  type="text"
                  className="mt-4 p-3 rounded-md border border-secondaryText bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
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
              <p className="italic text-center text-secondaryText">Waiting for match...</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
