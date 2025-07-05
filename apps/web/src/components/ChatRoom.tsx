// import { useState, useEffect, useRef } from 'react';
// import { useAuth } from '../context/AuthProvider';
// import { useWebSocket } from '../hooks/useWebSocket';
// import Sidebar from "../components/Sidebar";
// import TopNav from "../components/TopNav";
// import { useTheme } from "../context/themeContext";

// const wsUrl = import.meta.env.VITE_WS_URL;

// type Props = {
//   preferences?: any;
//   signOut: () => Promise<void>;
// };

// export default function ChatRoom({ preferences, signOut }: Props) {
//   const auth = useAuth();
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const { theme, toggleTheme } = useTheme();

//   if (!auth || !auth.user) {
//     return <div>Please log in</div>;
//   }
//   const { user } = auth;
//   const [input, setInput] = useState('');
//   const { connected, messages, sendMessage, peerId, roomId } = useWebSocket(
//     wsUrl,
//     user?.id || '',
//     preferences || {}
//   );

//   // Removed peerEmail state and fetching

//   // Scroll chat to bottom when messages change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-text transition-colors duration-300">
//       <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar />

//         <main className="flex-1 p-12 overflow-y-auto flex flex-col">
//           <section className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col space-y-4 transition-colors duration-300">
//             <h2 className="text-3xl font-extrabold">Chat Room</h2>
//             <p>Status: <span className={connected ? "text-green-500" : "text-red-500"}>{connected ? 'Connected' : 'Disconnected'}</span></p>

//             {roomId ? (
//               <>
//                 <p className="mb-4">Connected to: <span className="font-semibold">{peerId}</span></p>
//                 <div className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md p-4 overflow-y-auto h-80 bg-gray-50 dark:bg-gray-800">
//                   {messages.length === 0 ? (
//                     <p className="text-center text-gray-400">No messages yet</p>
//                   ) : (
//                     messages.map((msg, i) => (
//                       <div key={i} className="mb-2">
//                         {msg}
//                       </div>
//                     ))
//                   )}
//                   <div ref={messagesEndRef} />
//                 </div>

//                 <input
//                   type="text"
//                   className="mt-4 p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
//                   placeholder="Type a message and press Enter"
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && input.trim()) {
//                       sendMessage(input.trim());
//                       setInput('');
//                     }
//                   }}
//                 />
//               </>
//             ) : (
//               <p className="italic text-center text-gray-500 dark:text-gray-400">Waiting for match...</p>
//             )}
//           </section>
//         </main>
//       </div>
//     </div>
//   );
// }


// import { useState, useEffect, useRef } from 'react';
// import { useAuth } from '../context/AuthProvider';
// import { useWebSocket } from '../hooks/useWebSocket';
// import Sidebar from "../components/Sidebar";
// import TopNav from "../components/TopNav";
// import { useTheme } from "../context/themeContext";

// const wsUrl = import.meta.env.VITE_WS_URL;

// type Props = {
//   preferences?: any;
//   signOut: () => Promise<void>;
// };

// export default function ChatRoom({ preferences, signOut }: Props) {
//   const auth = useAuth();
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const { theme, toggleTheme } = useTheme();

//   if (!auth || !auth.user) {
//     return <div>Please log in</div>;
//   }
//   const { user } = auth;
//   const [input, setInput] = useState('');
//   const { connected, messages, sendMessage, peerId, roomId, localStream, remoteStream } = useWebSocket(
//     wsUrl,
//     user?.id || '',
//     preferences || {}
//   );

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-text transition-colors duration-300">
//       <TopNav theme={theme} toggleTheme={toggleTheme} signOut={signOut} />

//       <div className="flex flex-1 overflow-hidden">
//         <Sidebar />

//         <main className="flex-1 p-12 overflow-y-auto flex flex-col space-y-4">
//           <section className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 flex flex-col space-y-4 transition-colors duration-300">
//             <h2 className="text-3xl font-extrabold">Chat Room</h2>
//             <p>Status: <span className={connected ? "text-green-500" : "text-red-500"}>{connected ? 'Connected' : 'Disconnected'}</span></p>

//             {roomId ? (
//               <>
//                 <p className="mb-4">Connected to: <span className="font-semibold">{peerId}</span></p>

//                 <div className="flex space-x-4">
//                   <div className="flex flex-col items-center">
//                     <h3 className="mb-2">You</h3>
//                     <video
//                       className="rounded-md border border-gray-300 dark:border-gray-700"
//                       autoPlay
//                       muted
//                       playsInline
//                       ref={(video) => {
//                         if (video && localStream) {
//                           video.srcObject = localStream;
//                         }
//                       }}
//                       style={{ width: 240, height: 180 }}
//                     />
//                   </div>

//                   <div className="flex flex-col items-center">
//                     <h3 className="mb-2">Peer</h3>
//                     <video
//                       className="rounded-md border border-gray-300 dark:border-gray-700"
//                       autoPlay
//                       playsInline
//                       ref={(video) => {
//                         if (video && remoteStream) {
//                           video.srcObject = remoteStream;
//                         }
//                       }}
//                       style={{ width: 240, height: 180 }}
//                     />
//                   </div>
//                 </div>

//                 <div className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md p-4 overflow-y-auto h-40 bg-gray-50 dark:bg-gray-800 mt-4">
//                   {messages.length === 0 ? (
//                     <p className="text-center text-gray-400">No messages yet</p>
//                   ) : (
//                     messages.map((msg, i) => (
//                       <div key={i} className="mb-2">
//                         {msg}
//                       </div>
//                     ))
//                   )}
//                   <div ref={messagesEndRef} />
//                 </div>

//                 <input
//                   type="text"
//                   className="mt-4 p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
//                   placeholder="Type a message and press Enter"
//                   value={input}
//                   onChange={(e) => setInput(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && input.trim()) {
//                       sendMessage(input.trim());
//                       setInput('');
//                     }
//                   }}
//                 />
//               </>
//             ) : (
//               <p className="italic text-center text-gray-500 dark:text-gray-400">Waiting for match...</p>
//             )}
//           </section>
//         </main>
//       </div>
//     </div>
//   );
// }




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
    peerId,
    roomId,
    localStream,
    remoteStream,
    peerConnection
  } = useWebSocket(wsUrl, auth?.user?.id || '', preferences || {});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const formatted = messages.map((msg: string) => ({
      sender: peerId || "Peer",
      text: msg,
      timestamp: new Date().toISOString(),
    }));
    setChatMessages(formatted);
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
    window.location.reload(); // Ideally replace with proper cleanup
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
                <p>Connected to: <span className="font-semibold">{peerId}</span></p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VideoTile name="You" stream={localStream} muted />
                  <VideoTile name="Peer" stream={remoteStream} />
                </div>

                <ControlsBar
                  micOn={micOn}
                  videoOn={videoOn}
                  onToggleMic={toggleMic}
                  onToggleVideo={toggleVideo}
                  onEndCall={endCall}
                  onShareScreen={shareScreen}
                />

                <div className="border border-secondaryText rounded-md p-4 overflow-y-auto h-40 bg-muted">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-tertiaryText">No messages yet</p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="text-sm bg-primary/10 dark:bg-primary/20 rounded-lg px-3 py-2 my-1 w-fit max-w-xs">
                        <div className="font-semibold">{msg.sender}</div>
                        <div>{msg.text}</div>
                        <div className="text-xs text-secondaryText">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))
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
