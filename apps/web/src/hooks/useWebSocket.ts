import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  // TODO: Add TURN servers here for production usage
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerUsername, setPeerUsername] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const onCallEndedRef = useRef<() => void>(() => {});

  const signalQueueRef = useRef<Array<{ signalType: string; data: any }>>([]);

  const sendSignal = useCallback((signalType: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'signal', signalType, data }));
    }
  }, []);

  const sendRaw = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const msg: ChatMessage = {
        sender: userId,
        text,
        timestamp: new Date().toISOString(),
      };
      sendRaw({ type: 'chat', message: msg });
      setMessages((prev) => [...prev, msg]);
    },
    [sendRaw, userId]
  );

  const cleanUpCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
    setPeerId(null);
    setPeerUsername(null);
    setRoomId(null);
  }, []);

  const sendCallEnded = useCallback(() => {
    sendRaw({ type: 'call_ended', roomId });
    cleanUpCall();
  }, [sendRaw, cleanUpCall, roomId]);


  // --- HANDLE SIGNAL (declared first!) ---
  const handleSignal = useCallback(
    async (signalType: string, data: any) => {
      const pc = pcRef.current;
      if (!pc) {
        signalQueueRef.current.push({ signalType, data });
        return;
      }

      try {
        switch (signalType) {
          case 'offer':
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            if (pc.localDescription) {
              sendSignal('answer', pc.localDescription);
            }
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

          default:
            console.warn('Unknown signal type:', signalType);
            break;
        }
      } catch (error) {
        console.error('Error handling signal:', error);
      }
    },
    [sendSignal]
  );

  // --- SETUP PEER CONNECTION ---
  const setupPeerConnection = useCallback(
    (isInitiator: boolean) => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

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
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStream.getTracks().find((t) => t.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('candidate', event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (onCallEndedRef.current) {
            onCallEndedRef.current();
          }
          cleanUpCall();
        }
      };

      // Process any queued signals now that pc exists and handleSignal is available
      if (signalQueueRef.current.length > 0) {
        signalQueueRef.current.forEach(({ signalType, data }) => {
          handleSignal(signalType, data);
        });
        signalQueueRef.current = [];
      }

      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            if (pc.localDescription) {
              sendSignal('offer', pc.localDescription);
            }
          })
          .catch(console.error);
      }
    },
    [sendSignal, handleSignal, cleanUpCall]
  );

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
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (e) {
        console.warn('Invalid JSON from WS:', event.data);
        return;
      }

      if (!data?.type && typeof data.text === 'string') {
        try {
          const inner = JSON.parse(data.text);
          if (inner?.type) data = inner;
        } catch {
          // ignore
        }
      }

      if (!data?.type) {
        console.warn('Message missing "type":', data);
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
          const msg: ChatMessage =
            typeof data.message === 'string' ? JSON.parse(data.message) : data.message;
          setMessages((prev) => [...prev, msg]);
          break;

        case 'signal':
          await handleSignal(data.signalType, data.data);
          break;

        case 'call_ended':
          if (data.roomId === roomId) {
            if (onCallEndedRef.current) {
              onCallEndedRef.current();
            }
            cleanUpCall();
          }
          break;


        default:
          console.warn('Unknown message type:', data.type);
          break;
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
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((t) => t.stop());
        remoteStreamRef.current = null;
      }

      setLocalStream(null);
      setRemoteStream(null);
    };

    return () => {
      ws.close();
    };
  }, [userId, url, setupPeerConnection, handleSignal, cleanUpCall]);

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

  const setOnCallEnded = useCallback((callback: () => void) => {
    onCallEndedRef.current = callback;
  }, []);

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
    onCallEnded: setOnCallEnded,
  };
}
