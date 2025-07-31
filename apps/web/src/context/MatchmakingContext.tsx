import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const MatchmakingContext = createContext(null);

export function MatchmakingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isQueued, setIsQueued] = useState(false);
  const [matchOffer, setMatchOffer] = useState<{ username: string; roomId: string } | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!isQueued || !user) return;

    const socket = new WebSocket(import.meta.env.VITE_WS_URL);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join_queue", userId: user.id }));
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "match_found") {
        setMatchOffer({ username: msg.partnerUsername, roomId: msg.roomId });
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    socket.onclose = () => {
      setWs(null);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [isQueued, user]);

  const joinQueue = () => setIsQueued(true);
  const leaveQueue = () => {
    setIsQueued(false);
    setMatchOffer(null);
  };

  const acceptMatch = () => {
    if (!matchOffer) return;
    navigate(`/chat/${matchOffer.roomId}`);
    setMatchOffer(null);
    setIsQueued(false);
  };

  const declineMatch = () => {
    setMatchOffer(null);
    // optionally remain in queue
  };

  return (
    <MatchmakingContext.Provider
      value={{
        isQueued,
        joinQueue,
        leaveQueue,
        matchOffer,
        acceptMatch,
        declineMatch,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
}

export function useMatchmaking() {
  return useContext(MatchmakingContext);
}
