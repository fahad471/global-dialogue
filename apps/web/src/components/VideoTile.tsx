// components/VideoTile.tsx
import { useEffect, useRef } from "react";

type Props = {
  name: string;
  stream: MediaStream | null;
  muted?: boolean;
};

export default function VideoTile({ name, stream, muted = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 px-2 py-1 text-sm text-white">
        {name}
      </div>
    </div>
  );
}
