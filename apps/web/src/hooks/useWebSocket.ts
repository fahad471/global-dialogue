import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url: string, userId: string, preferences: any) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Effect to establish WebSocket connection — depends only on userId and url
  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Send initial user info and preferences once connection opens
      ws.send(
        JSON.stringify({
          type: 'init',
          userId,
          preferences,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'matched') {
        setRoomId(data.roomId);
        setPeerId(data.peerId);
      } else if (data.type === 'chat') {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setPeerId(null);
      setRoomId(null);
    };

    // Cleanup on unmount or userId/url change
    return () => {
      ws.close();
    };
  }, [userId, url]);

  // Effect to send preferences updates when preferences change, but connection is open
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

  // Function to send chat messages over the WebSocket
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
  };
}
