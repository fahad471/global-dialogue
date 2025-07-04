import { useState, useEffect } from "react";

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(setDevices);
  }, []);

  return {
    microphones: devices.filter(d => d.kind === 'audioinput'),
    cameras: devices.filter(d => d.kind === 'videoinput'),
  };
}
