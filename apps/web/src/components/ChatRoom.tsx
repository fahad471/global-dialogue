import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useWebSocket } from '../hooks/useWebSocket';
import { useTheme } from '../context/themeContext';
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import VideoTile from "./VideoTile";
import ControlsBar from "./ControlsBar";
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const wsUrl = import.meta.env.VITE_WS_URL;

type Props = { preferences?: any; signOut: () => Promise<void>; };
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
type Topic = { id: string; name: string; };

export default function ChatRoom({ preferences, signOut }: Props) {
  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [focused, setFocused] = useState<"local" | "remote" | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [incomingCall, setIncomingCall] = useState(false);
  const [userAcceptedCall, setUserAcceptedCall] = useState(false);
  const [preJoinMicOn, setPreJoinMicOn] = useState(true);
  const [preJoinVideoOn, setPreJoinVideoOn] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const callStartTime = useRef(Date.now());

  const {
    connected,
    messages,       // This is an array of parsed messages, NOT raw JSON strings
    sendMessage,
    sendCallEnded,
    peerUsername,
    roomId,
    localStream,
    remoteStream,
    peerConnection,
    onCallEnded
  } = useWebSocket(wsUrl, auth?.user?.id || '', preferences || {});

  useEffect(() => {
    async function fetchTopics() {
      const { data, error } = await supabase.from('topics').select('id,name').order('name', { ascending: true });
      if (error) console.error("Failed to fetch topics:", error);
      else if (data) setTopics(data);
    }
    fetchTopics();
  }, []);

  useEffect(() => {
    if (onCallEnded) {
      onCallEnded(() => {
        endCall();
        setShowRatingForm(true);
      });
    }
  }, [onCallEnded]);

  useEffect(() => {
    if (peerUsername && roomId && !userAcceptedCall) {
      setIncomingCall(true);
    }
  }, [peerUsername, roomId, userAcceptedCall]);

  // Now, `messages` is an array of parsed Message objects already, so just set directly
useEffect(() => {
  console.log("All incoming messages:", messages);
  if (!messages) return;

  // Helper to safely parse JSON strings
  function tryParseJSON(jsonString: string) {
    try {
      const obj = JSON.parse(jsonString);
      if (obj && typeof obj === 'object') return obj;
    } catch {
      return null;
    }
    return null;
  }
  const hasCallDecline = messages.some(msg => {
    if (msg.type === 'call_declined') return true;

    if (typeof msg.text === 'string') {
      const parsed = tryParseJSON(msg.text);
      return parsed?.type === 'call_declined';
    }

    return false;
  });
  // Check for call_ended inside message.type OR inside message.text JSON
  const hasCallEnded = messages.some(msg => {
    if (msg.type === 'call_ended') return true;

    if (typeof msg.text === 'string') {
      const parsed = tryParseJSON(msg.text);
      return parsed?.type === 'call_ended';
    }

    return false;
  });

  console.log("Call ended message detected?", hasCallEnded);

  if (hasCallEnded) {
    setShowRatingForm(true);
    cleanUpCall();
  }
  if (hasCallDecline) {
    cleanUpCall();
    // navigate('/matchpreferences')
  }

  // Filter out messages that have type 'call_ended' either at root or inside text JSON
  const filteredMessages = messages.filter(msg => {
    if (msg.type === 'call_ended') return false;

    if (typeof msg.text === 'string') {
      const parsed = tryParseJSON(msg.text);
      return parsed?.type !== 'call_ended';
    }

    return true;
  });

  // Format remaining chat messages as usual
  const formattedMessages: Message[] = filteredMessages.map(msg => {
    let textContent = msg.text || "";

    // Parse JSON stringified text if needed
    try {
      const parsed = JSON.parse(textContent);
      if (parsed && typeof parsed === "object" && parsed.text) {
        textContent = parsed.text;
      }
    } catch (e) {
      // Not JSON, keep original
    }

    return {
      sender: msg.sender || peerUsername || "Peer",
      text: textContent,
      timestamp: msg.timestamp || new Date().toISOString(),
      fact_check: msg.fact_check,
      toxicity: msg.toxicity,
      hate_speech: msg.hate_speech,
      rating: msg.rating,
      reasoning: msg.reasoning,
    };
  });

  setChatMessages(formattedMessages);

}, [messages, peerUsername]);






  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  const cleanUpCall = () => {
    // Stop local tracks
    localStream?.getTracks().forEach(t => t.stop());

    // Stop remote tracks
    remoteStream?.getTracks().forEach(t => t.stop());

    // Close the peer connection
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.close();
    }

    // Reset states related to the call
    setMicOn(true);
    setVideoOn(true);
    setFocused(null);
    setIncomingCall(false);
    setUserAcceptedCall(false);
    setChatMessages([]);
  };
  const declineCall = () => {
    sendMessage(JSON.stringify({ type: 'call_declined', roomId, sender: auth?.user?.id }));
    cleanUpCall();
    

  };

  
  const joinCall = () => {
    setMicOn(preJoinMicOn);
    setVideoOn(preJoinVideoOn);
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = preJoinMicOn);
      localStream.getVideoTracks().forEach(t => t.enabled = preJoinVideoOn);
    }
    setIncomingCall(false);
    setUserAcceptedCall(true);
    callStartTime.current = Date.now();
  };

  const endCall = () => {
    sendMessage(JSON.stringify({ type: 'call_ended', roomId, sender: auth?.user?.id }));

    // Stop media streams (local & remote)
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
  };



  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => t.enabled = !micOn);
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(t => t.enabled = !videoOn);
    setVideoOn(!videoOn);
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
        screenTrack.onended = () => {
          const originalTrack = localStream?.getVideoTracks()[0];
          if (originalTrack) sender.replaceTrack(originalTrack);
        };
      }
    } catch (err) {
      console.error("Screen share failed:", err);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth?.user) return alert('Not authenticated.');
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const { error } = await supabase.from('call_ratings').insert([{
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
      }]);
      if (error) throw error;
      alert("Thanks for your feedback!");
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert("Failed to submit rating: " + err.message);
    }
  };

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
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {connected ? "On Air" : "Disconnected"}
              </span>
            </div>

            {roomId && userAcceptedCall ? (
              <>
                <div
                  ref={videoContainerRef}
                  className="relative bg-[#1a1a1a] p-4 rounded-xl shadow-inner"
                  onClick={() => setFocused(null)}
                >
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (isFullscreen) document.exitFullscreen();
                        else videoContainerRef.current?.requestFullscreen();
                        setIsFullscreen(!isFullscreen);
                      }}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md"
                    >
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pointer-events-none">
                    <div
                      onClick={e => { e.stopPropagation(); setFocused("local"); }}
                      className={`flex flex-col items-center space-y-2 transition-all duration-300 transform cursor-pointer pointer-events-auto ${
                        focused === "remote" ? "scale-75 opacity-60" : focused === "local" ? "scale-110 z-10" : ""
                      }`}
                    >
                      <VideoTile name="You" stream={localStream} muted />
                      <div className="text-lg font-semibold">🎤 You</div>
                    </div>
                    <div
                      onClick={e => { e.stopPropagation(); setFocused("remote"); }}
                      className={`flex flex-col items-center space-y-2 transition-all duration-300 transform cursor-pointer pointer-events-auto ${
                        focused === "local" ? "scale-75 opacity-60" : focused === "remote" ? "scale-110 z-10" : ""
                      }`}
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
                  onEndCall={() => { sendCallEnded(); endCall(); }}
                  onShareScreen={shareScreen}
                />

                <div className="bg-[#141414] rounded-xl p-4 h-64 overflow-y-auto space-y-3 border border-gray-700">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500">No transcript yet.</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="text-sm break-words">
                        <span className="font-bold text-primary">
                          {msg.sender === auth?.user?.id ? "You" : peerUsername || "Peer"}
                        </span>: {msg.text}
                        {(msg.fact_check !== undefined || msg.toxicity !== undefined || msg.hate_speech !== undefined || msg.rating !== undefined) && (
                          <div className="text-xs text-gray-400 ml-2">
                            {msg.fact_check !== undefined && <>✅ {msg.fact_check ? "Accurate" : "Inaccurate"} | </>}
                            {msg.toxicity !== undefined && <>Toxicity: {msg.toxicity.toFixed(2)} | </>}
                            {msg.hate_speech !== undefined && <>Hate: {msg.hate_speech ? "🚫" : "No"} | </>}
                            {msg.rating !== undefined && <>🎯 {msg.rating}/10</>}
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
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && input.trim()) {
                      sendMessage(JSON.stringify({ text: input.trim(), sender: auth.user.id, timestamp: new Date().toISOString() }));
                      setInput("");
                    }
                  }}
                />
              </>
            ) : !incomingCall ? (
              <div className="text-center text-gray-400 italic mt-12 text-lg">
                Finding a podcast partner...
              </div>
            ) : null}
          </div>
        </main>

        {incomingCall && !userAcceptedCall && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
            <div className="bg-[#1e1e1e] text-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-5">
              <h2 className="text-2xl font-bold">Incoming Call</h2>
              <p>You’ve been matched with <span className="text-primary font-semibold">{peerUsername}</span>.</p>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={preJoinMicOn} onChange={() => setPreJoinMicOn(p => !p)} />
                  <span>Join with microphone</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={preJoinVideoOn} onChange={() => setPreJoinVideoOn(p => !p)} />
                  <span>Join with camera</span>
                </label>
              </div>
              <div className="flex justify-end space-x-4 mt-4">
                <button onClick={() => declineCall()}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-500">
                  Decline
                </button>

                <button onClick={joinCall}
                  className="px-4 py-2 rounded bg-green-600 hover:bg-green-500">
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}

        {showRatingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <form onSubmit={handleRatingSubmit}
              className="bg-[#222] rounded-lg p-6 max-w-lg w-full space-y-4 text-white">
              <h2 className="text-2xl font-bold mb-4">Rate Your Call</h2>
              <input type="hidden" name="conversation_id" value={roomId ?? ""} />
              {["knowledge", "respectfulness", "engagement", "clarity", "overall"].map(field => (
                <label key={field} className="block">
                  {field.charAt(0).toUpperCase() + field.slice(1)} (1‑10):
                  <input
                    type="number"
                    name={field}
                    min={1}
                    max={10}
                    required
                    className="w-full p-2 rounded bg-[#333] mt-1 text-white"
                  />
                </label>
              ))}
              <label className="block">
                Topic:
                <select name="topic" className="w-full p-2 rounded bg-[#333] mt-1 text-white">
                  <option value="">Select a topic</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                Stance:
                <select name="stance" className="w-full p-2 rounded bg-[#333] mt-1 text-white">
                  <option value="">Select your stance</option>
                  <option value="neutral">Neutral</option>
                  <option value="pro">Pro</option>
                  <option value="con">Con</option>
                </select>
              </label>
              <label className="block">
                Additional Feedback:
                <textarea
                  name="feedback"
                  rows={3}
                  className="w-full p-2 rounded bg-[#333] mt-1 text-white"
                />
              </label>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
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
