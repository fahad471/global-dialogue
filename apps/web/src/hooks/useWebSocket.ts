import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // Add TURN for production if needed
];

type ChatMessage = {
  sender: string;
  text: string;
  timestamp: string;
  [key: string]: any;
};

export function useWebSocket(url: string, userId: string, preferences: any) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerUsername, setPeerUsername] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const onCallEndedRef = useRef<() => void>(() => {});

  const sendSignal = (signalType: string, data: any) => {
    wsRef.current?.send(JSON.stringify({ type: 'signal', signalType, data }));
  };

  const sendRaw = (payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const sendMessage = (text: string) => {
    const msg: ChatMessage = {
      sender: userId,
      text,
      timestamp: new Date().toISOString(),
    };

    sendRaw({ type: 'chat', message: msg });
    setMessages((prev) => [...prev, JSON.stringify(msg)]);
  };

  const sendCallEnded = () => {
    sendRaw({ type: 'call_ended' });
  };

  const setupPeerConnection = (isInitiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    setRemoteStream(remoteStream);

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('candidate', event.candidate);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          sendSignal('offer', pc.localDescription);
        })
        .catch(console.error);
    }
  };

  const handleSignal = async (signalType: string, data: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    switch (signalType) {
      case 'offer':
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal('answer', pc.localDescription);
        break;
      case 'answer':
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        break;
      case 'candidate':
        if (data) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data));
          } catch (e) {
            console.warn('Error adding received ICE candidate', e);
          }
        }
        break;
    }
  };

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = async () => {
      setConnected(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }

      ws.send(JSON.stringify({
        type: 'init',
        userId,
        preferences,
      }));
    };

    ws.onmessage = async (event) => {
      console.log("🌐 WebSocket message received:", event.data);

      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.warn("❌ Invalid JSON from WS:", event.data);
        return;
      }

      // If no top-level type but `text` is stringified JSON with type inside, parse it
      if (!data?.type && typeof data.text === 'string') {
        try {
          const inner = JSON.parse(data.text);
          if (inner?.type) {
            data = inner;
          }
        } catch {
          // ignore parse errors, keep data as is
        }
      }

      if (!data?.type) {
        console.warn("⚠️ Message missing 'type':", data);
        return;
      }

      switch (data.type) {
        case 'matched':
          setRoomId(data.roomId);
          setPeerId(data.peerId);
          setPeerUsername(data.peerUsername);
          setupPeerConnection(userId < data.peerId);
          break;

        case 'chat':
          const msg = typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
          setMessages((prev) => [...prev, JSON.stringify(msg)]);
          break;

        case 'signal':
          await handleSignal(data.signalType, data.data);
          break;

        case 'call_ended':
          console.log("📡 call_ended message received from peer");
          if (onCallEndedRef.current) {
            console.log("✅ Triggering onCallEndedRef callback");
            onCallEndedRef.current();
          } else {
            console.warn("⚠️ onCallEndedRef not set yet");
          }
          break;

        default:
          console.warn("❓ Unknown message type:", data.type);
          break;
      }
    };


    ws.onclose = () => {
      setConnected(false);
      setPeerId(null);
      setRoomId(null);

      pcRef.current?.close();
      pcRef.current = null;

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current?.getTracks().forEach((t) => t.stop());

      localStreamRef.current = null;
      remoteStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
    };

    return () => {
      ws.close();
    };
  }, [userId, url]);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'updatePreferences',
        preferences,
      }));
    }
  }, [preferences]);

  return {
    connected,
    messages,
    sendMessage,
    sendCallEnded,
    peerUsername,
    peerId,
    roomId,
    localStream,
    remoteStream,
    peerConnection: pcRef.current,
    onCallEnded: (callback: () => void) => {
      onCallEndedRef.current = callback;
    },
  };
}
