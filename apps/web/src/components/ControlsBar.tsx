// ControlsBar.tsx
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from 'lucide-react';

export default function ControlsBar({
  micOn,
  videoOn,
  onToggleMic,
  onToggleVideo,
  onEndCall,
  onShareScreen,
}: {
  micOn: boolean;
  videoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onShareScreen: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 shadow-xl rounded-full px-6 py-3 flex items-center gap-6 z-50">
      <button
        onClick={onToggleMic}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Toggle mic"
      >
        {micOn ? <Mic className="text-black dark:text-white" /> : <MicOff className="text-red-500" />}
      </button>

      <button
        onClick={onToggleVideo}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Toggle video"
      >
        {videoOn ? <Video className="text-black dark:text-white" /> : <VideoOff className="text-red-500" />}
      </button>

      <button
        onClick={onShareScreen}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="Share screen"
      >
        <Monitor className="text-black dark:text-white" />
      </button>

      <button
        onClick={onEndCall}
        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
        aria-label="End call"
      >
        <PhoneOff />
      </button>
    </div>
  );
}