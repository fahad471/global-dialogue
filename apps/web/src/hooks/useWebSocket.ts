// import { useEffect, useRef, useState } from 'react';

// export function useWebSocket(url: string, userId: string, preferences: any) {
//   const wsRef = useRef<WebSocket | null>(null);
//   const [connected, setConnected] = useState(false);
//   const [messages, setMessages] = useState<string[]>([]);
//   const [peerId, setPeerId] = useState<string | null>(null);
//   const [roomId, setRoomId] = useState<string | null>(null);

//   // Effect to establish WebSocket connection — depends only on userId and url
//   useEffect(() => {
//     if (!userId) return;

//     const ws = new WebSocket(url);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       setConnected(true);
//       // Send initial user info and preferences once connection opens
//       ws.send(
//         JSON.stringify({
//           type: 'init',
//           userId,
//           preferences,
//         })
//       );
//     };

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.type === 'matched') {
//         setRoomId(data.roomId);
//         setPeerId(data.peerId);
//       } else if (data.type === 'chat') {
//         setMessages((prev) => [...prev, data.message]);
//       }
//     };

//     ws.onclose = () => {
//       setConnected(false);
//       setPeerId(null);
//       setRoomId(null);
//     };

//     // Cleanup on unmount or userId/url change
//     return () => {
//       ws.close();
//     };
//   }, [userId, url]);

//   // Effect to send preferences updates when preferences change, but connection is open
//   useEffect(() => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(
//         JSON.stringify({
//           type: 'updatePreferences',
//           preferences,
//         })
//       );
//     }
//   }, [preferences]);

//   // Function to send chat messages over the WebSocket
//   const sendMessage = (message: string) => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ type: 'chat', message }));
//       setMessages((prev) => [...prev, `You: ${message}`]);
//     }
//   };

//   return {
//     connected,
//     messages,
//     sendMessage,
//     peerId,
//     roomId,
//   };
// }
import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // You can add TURN servers here for production
];

export function useWebSocket(url: string, userId: string, preferences: any) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const sendSignal = (signalType: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'signal', signalType, data }));
    }
  };

  const setupPeerConnection = (isInitiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    setRemoteStream(remoteStream);

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('candidate', event.candidate);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
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

      ws.send(
        JSON.stringify({
          type: 'init',
          userId,
          preferences,
        })
      );
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'matched') {
        setRoomId(data.roomId);
        setPeerId(data.peerId);

        const initiator = userId < data.peerId;
        setupPeerConnection(initiator);
      } else if (data.type === 'chat') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'signal') {
        await handleSignal(data.signalType, data.data);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setPeerId(null);
      setRoomId(null);

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(t => t.stop());
        remoteStreamRef.current = null;
        setRemoteStream(null);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId, url]);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'updatePreferences',
          preferences,
        })
      );
    }
  }, [preferences]);

  const sendMessage = (message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat', message }));
      setMessages((prev) => [...prev, `You: ${message}`]);
    }
  };

  return {
    connected,
    messages,
    sendMessage,
    peerId,
    roomId,
    localStream,
    remoteStream,
    peerConnection: pcRef.current, // Optional, if you want to expose it
  };
}
