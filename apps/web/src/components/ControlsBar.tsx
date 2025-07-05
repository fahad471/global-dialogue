// components/ControlsBar.tsx
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhoneSlash, FaDesktop } from 'react-icons/fa';

type Props = {
  micOn: boolean;
  videoOn: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onShareScreen: () => void;
};

export default function ControlsBar({ micOn, videoOn, onToggleMic, onToggleVideo, onEndCall, onShareScreen }: Props) {
  return (
    <div className="flex justify-center space-x-4 py-4">
      <button onClick={onToggleMic} className="p-3 rounded-full bg-gray-800 text-text hover:bg-gray-700">
        {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
      </button>
      <button onClick={onToggleVideo} className="p-3 rounded-full bg-gray-800 text-text hover:bg-gray-700">
        {videoOn ? <FaVideo /> : <FaVideoSlash />}
      </button>
      <button onClick={onShareScreen} className="p-3 rounded-full bg-gray-800 text-text hover:bg-gray-700">
        <FaDesktop />
      </button>
      <button onClick={onEndCall} className="p-3 rounded-full bg-red-600 text-text hover:bg-red-500">
        <FaPhoneSlash />
      </button>
    </div>
  );
}
