import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTheme } from '../context/themeContext';
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import VideoTile from "./VideoTile";
import ControlsBar from "./ControlsBar";
import { supabase } from '../lib/supabaseClient';  // your existing client
import { useNavigate } from 'react-router-dom';


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

type Topic = {
  id: string;
  name: string;
};

export default function ChatRoom({ preferences, signOut }: Props) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [focused, setFocused] = useState<"local" | "remote" | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();


  // New state for topics fetched from Supabase
  const [topics, setTopics] = useState<Topic[]>([]);

  const {
    connected,
    messages,
    sendMessage,
    sendCallEnded,
    peerUsername,
    roomId,
    localStream,
    remoteStream,
    peerConnection,
    onCallEnded, // ✅ Include this
  } = useWebSocket(wsUrl, auth?.user?.id || '', preferences || {});

  // For showing rating form
  const [showRatingForm, setShowRatingForm] = useState(false);

  // Track call start time for duration
  const callStartTime = useRef(Date.now());
  useEffect(() => {
    if (onCallEnded) {
      console.log("✅ Registering onCallEnded callback");

      onCallEnded(() => {
        console.log("✅ onCallEnded callback triggered in ChatRoom");
        endCall();
        setShowRatingForm(true);
      });
    }
  }, [onCallEnded]);


  // Fetch topics from Supabase on mount
  useEffect(() => {
    async function fetchTopics() {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error("Failed to fetch topics:", error);
        return;
      }
      if (data) setTopics(data);
    }

    fetchTopics();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    try {
const formatted: Message[] = [];

messages.forEach((msgStr: string) => {
  try {
    const msg = JSON.parse(msgStr);

    if (msg.type === 'call_ended') {
      setShowRatingForm(true);
      return;
    }

    formatted.push({
      sender: msg.sender || peerUsername || "Peer",
      text: msg.text || "",
      timestamp: msg.timestamp || new Date().toISOString(),
      fact_check: msg.fact_check,
      toxicity: msg.toxicity,
      hate_speech: msg.hate_speech,
      rating: msg.rating,
      reasoning: msg.reasoning,
    });
  } catch {
    formatted.push({
      sender: peerUsername || "Peer",
      text: msgStr,
      timestamp: new Date().toISOString(),
    });
  }
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
    localStream?.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
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

    // Notify peer
    sendMessage(JSON.stringify({ type: 'call_ended' }));

    setShowRatingForm(true);
  };


  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  // Handle form submission with conversation_id from roomId and sliders for ratings
  async function handleRatingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!auth?.user) return alert('Not authenticated.');

    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from('call_ratings').insert([
        {
          user_id: auth.user.id,
          partner_id: peerUsername || 'unknown',
          conversation_id: formData.get("conversation_id"),
          knowledge: Number(formData.get("knowledge")),
          respectfulness: Number(formData.get("respectfulness")),
          engagement: Number(formData.get("engagement")),
          clarity: Number(formData.get("clarity")),
          overall: Number(formData.get("overall")),
          feedback: formData.get("feedback") as string,
          topic: formData.get("topic"),
          stance: formData.get("stance"),
          call_duration_sec: Math.floor((Date.now() - callStartTime.current) / 1000),
          created_at: new Date().toISOString()
        }
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Failed to submit rating: " + error.message);
        return;
      }

      alert("Thanks for your feedback!");
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Unexpected error submitting rating");
    }
  }

  if (!auth?.user) return <div>Please log in</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text transition-colors duration-300">
      <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 p-4 md:p-8 flex flex-col items-center bg-[#0f0f0f] text-white space-y-6">
          <div className="w-full max-w-6xl space-y-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">🎙️ Live Podcast Room</h1>
              <span
                className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {connected ? "On Air" : "Disconnected"}
              </span>
            </div>

            {roomId ? (
              <>
                <div
                  className="relative bg-[#1a1a1a] p-4 rounded-xl shadow-inner"
                  onClick={() => setFocused(null)}
                  ref={videoContainerRef}
                >
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md"
                    >
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pointer-events-none">
                    <div
                      className={`flex flex-col items-center space-y-2 transition-all duration-300 transform cursor-pointer pointer-events-auto ${
                        focused === "remote"
                          ? "scale-75 opacity-60"
                          : focused === "local"
                          ? "scale-110 z-10"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocused("local");
                      }}
                    >
                      <VideoTile name="You" stream={localStream} muted />
                      <div className="text-lg font-semibold">🎤 You</div>
                    </div>

                    <div
                      className={`flex flex-col items-center space-y-2 transition-all duration-300 transform cursor-pointer pointer-events-auto ${
                        focused === "local"
                          ? "scale-75 opacity-60"
                          : focused === "remote"
                          ? "scale-110 z-10"
                          : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocused("remote");
                      }}
                    >
                      <VideoTile name={peerUsername || "Peer"} stream={remoteStream} />
                      <div className="text-lg font-semibold">🎧 {peerUsername || "Guest"}</div>
                    </div>
                  </div>
                </div>

                <ControlsBar
                  micOn={micOn}
                  videoOn={videoOn}
                  onToggleMic={toggleMic}
                  onToggleVideo={toggleVideo}
                  onEndCall={() => {
  sendCallEnded();  // Notify peer
  endCall();
}}

                  onShareScreen={shareScreen}
                />

                <div className="bg-[#141414] rounded-xl p-4 h-64 overflow-y-auto space-y-3 border border-gray-700">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500">No transcript yet.</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-bold text-primary">
                          {msg.sender === auth?.user?.id ? "You" : peerUsername || "Peer"}
                        </span>
                        : {msg.text}
                        {msg.fact_check !== undefined && (
                          <div className="text-xs text-gray-400 ml-2">
                            ✅ {msg.fact_check ? "Accurate" : "Inaccurate"} | Toxicity:{" "}
                            {msg.toxicity?.toFixed(2)} | Hate: {msg.hate_speech ? "🚫" : "No"} | 🎯{" "}
                            {msg.rating}/10
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <input
                  type="text"
                  className="w-full mt-4 p-3 rounded-md border border-gray-600 bg-[#1e1e1e] text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Type your next thought and press Enter..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && input.trim()) {
                      sendMessage(input.trim());
                      setInput("");
                    }
                  }}
                />
              </>
            ) : (
              <div className="text-center text-gray-400 italic mt-12 text-lg">
                Finding a podcast partner...
              </div>
            )}
          </div>
        </main>

        {/* Rating Form Modal */}
        {showRatingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <form
              onSubmit={handleRatingSubmit}
              className="bg-[#222] rounded-lg p-6 max-w-lg w-full space-y-4 text-white"
            >
              <h2 className="text-2xl font-bold mb-4">Rate Your Call</h2>

              <input type="hidden" name="conversation_id" value={roomId ?? ""} />

              {["knowledge", "respectfulness", "engagement", "clarity", "overall"].map((field) => (
                <label key={field} className="block">
                  {field.charAt(0).toUpperCase() + field.slice(1)} (1-10):
                  <input
                    name={field}
                    type="range"
                    min={1}
                    max={10}
                    defaultValue={5}
                    step={1}
                    className="w-full mt-1"
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      const valueDisplay = document.getElementById(`${field}-value`);
                      if (valueDisplay) valueDisplay.textContent = target.value;
                    }}
                  />
                  <span id={`${field}-value`} className="ml-2 font-semibold">5</span>
                </label>
              ))}

              <label className="block">
                Feedback (optional):
                <textarea
                  name="feedback"
                  rows={3}
                  className="w-full p-2 mt-1 rounded bg-[#111] text-white"
                />
              </label>

              <label className="block">
                Topic:
                <select
                  name="topic"
                  required
                  className="w-full p-2 mt-1 rounded bg-[#111] text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Select a topic</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                Stance:
                <select
                  name="stance"
                  required
                  className="w-full p-2 mt-1 rounded bg-[#111] text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Select stance</option>
                  <option value="For">For</option>
                  <option value="Against">Against</option>
                </select>
              </label>

              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary hover:bg-primary-dark"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
