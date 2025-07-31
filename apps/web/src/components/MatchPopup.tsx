// MatchPopup.tsx
import { useMatchmaking } from "../context/MatchmakingContext";

export default function MatchPopup() {
  const { matchOffer, acceptMatch, declineMatch } = useMatchmaking();

  if (!matchOffer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#222] p-6 rounded-lg space-y-4 text-white max-w-sm w-full">
        <h2 className="text-2xl font-bold">🎙 Match Found!</h2>
        <p>You've been matched with <span className="text-primary font-semibold">{matchOffer.username}</span>.</p>
        <div className="flex justify-end gap-4">
          <button onClick={declineMatch} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">Decline</button>
          <button onClick={acceptMatch} className="px-4 py-2 bg-green-600 rounded hover:bg-green-500">Accept</button>
        </div>
      </div>
    </div>
  );
}
