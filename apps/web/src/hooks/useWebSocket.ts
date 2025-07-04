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

  // Helper to send signaling message over WebSocket
  const sendSignal = (signalType: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'signal', signalType, data }));
    }
  };

  // Setup WebRTC peer connection
  const setupPeerConnection = (isInitiator: boolean) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add local tracks to connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }

    // Create or set remote stream
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    setRemoteStream(remoteStream);

    // When remote track arrives, add it to remote stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    };

    // ICE candidates handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('candidate', event.candidate);
      }
    };

    if (isInitiator) {
      // Create offer
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          sendSignal('offer', pc.localDescription);
        })
        .catch(console.error);
    }
  };

  // Handle incoming signaling data
  const handleSignal = async (signalType: string, data: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    switch (signalType) {
      case 'offer':
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        // Create answer
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

  // WebSocket effect
  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = async () => {
      setConnected(true);

      // Request local media (video + audio)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error('Error accessing media devices.', err);
        // Fallback or notify user
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

        // Decide initiator by lex order (simple deterministic)
        const initiator = userId < data.peerId;

        // Setup WebRTC connection
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

      // Cleanup peer connection and streams
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

    // Cleanup on unmount or userId/url change
    return () => {
      ws.close();
    };
  }, [userId, url]);

  // Update preferences after connection opens
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
  };
}
