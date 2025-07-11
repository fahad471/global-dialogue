// VideoTile.tsx
import { useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function VideoTile({ name, stream, muted }: { name: string; stream: MediaStream | null; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isVideoEnabled = stream?.getVideoTracks()?.some(track => track.enabled);

  return (
    <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden shadow-lg aspect-video w-full">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
      {!isVideoEnabled && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-lg">
          Video Off
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
        {name}
      </div>
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 bg-white/20 hover:bg-white/30 p-2 rounded-full text-white"
        aria-label="Toggle fullscreen"
      >
        {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}
