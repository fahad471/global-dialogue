import WebSocket from 'ws';
import { supabaseAdmin as supabase } from './supabaseAdmin';

type TopicWithStance = {
  topic: string;
  stance: 'for' | 'against';
};

type ClientData = {
  ws: WebSocket;
  userId: string;
  username?: string;
  preferences: {
    matchType: 'similar' | 'opposite' | 'random' | 'topic';
    topics: TopicWithStance[];
    language?: string | null;
    nationality?: string | null;
  };
  ideologicalStance?: string;
  personalityType?: string;
  coreBeliefs?: string[];
  profileNationality?: string | null; // Added: nationality from profiles table
  inRoom: boolean;
  roomId?: string;
};

export function createMatchmaker() {
  const clients = new Map<string, ClientData>();
  const waitingQueue: Set<string> = new Set();

  async function addClient(ws: WebSocket) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'init') {
          const userId = data.userId;
          if (!userId) {
            sendMessage(ws, { type: 'error', message: 'Missing userId' });
            return;
          }

          // Reconnection handling
          const existingClient = clients.get(userId);
          if (existingClient) {
            existingClient.ws.close();
            removeFromQueue(userId);
          }

          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select(`
              username,
              ideological_stance,
              personality_type,
              core_beliefs,
              nationality,
              user_selected_topics (
                topic:topic_id,
                stance
              )
            `)
            .eq('id', userId)
            .single();

          if (profileError || !profileData) {
            sendMessage(ws, { type: 'error', message: 'Profile fetch error' });
            return;
          }

          // Fetch preferences
          const { data: prefData, error: prefError } = await supabase
            .from('user_match_preferences')
            .select('preferred_match_type, language, nationality')
            .eq('id', userId)
            .maybeSingle();

          if (prefError) {
            console.error('Error fetching match preferences:', prefError);
          }

          const clientData: ClientData = {
            ws,
            userId,
            username: profileData.username,
            preferences: {
              matchType: prefData?.preferred_match_type || 'random',
              topics: profileData.user_selected_topics?.map((t: any) => ({
                topic: t.topic,
                stance: t.stance,
              })) || [],
              language: prefData?.language ?? null,
              nationality: prefData?.nationality ?? null,
            },
            ideologicalStance: profileData.ideological_stance,
            personalityType: profileData.personality_type,
            coreBeliefs: profileData.core_beliefs,
            profileNationality: profileData.nationality ?? null, // Set profile nationality
            inRoom: false,
          };

          clients.set(userId, clientData);
          enqueue(userId);
          tryMatch();
        }

        else if (data.type === 'chat') {
          const senderId = getUserIdByWs(ws);
          if (!senderId) return;

          const sender = clients.get(senderId);
          if (sender?.roomId) {
            broadcastToRoom(sender.roomId, ws, data.message);
          }
        }

        else if (data.type === 'signal') {
          const senderId = getUserIdByWs(ws);
          if (!senderId) return;

          const sender = clients.get(senderId);
          if (!sender?.roomId) return;

          for (const client of clients.values()) {
            if (client.roomId === sender.roomId && client.ws !== ws) {
              sendMessage(client.ws, {
                type: 'signal',
                signalType: data.signalType,
                data: data.data,
              });
              break;
            }
          }
        }

      } catch (err) {
        console.error('Error handling message:', err);
      }
    });

    ws.on('close', () => {
      const userId = getUserIdByWs(ws);
      if (userId) {
        removeClient(userId);
      }
    });
  }

  function getUserIdByWs(ws: WebSocket): string | undefined {
    for (const [id, client] of clients.entries()) {
      if (client.ws === ws) return id;
    }
    return undefined;
  }

  function sendMessage(ws: WebSocket, msg: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function removeClient(userId: string) {
    const client = clients.get(userId);
    if (!client) return;

    if (client.inRoom && client.roomId) {
      broadcastToRoom(client.roomId, client.ws, '__user_left__');
      for (const [id, c] of clients.entries()) {
        if (c.roomId === client.roomId) {
          c.inRoom = false;
          c.roomId = undefined;
          enqueue(id);
        }
      }
    }

    clients.delete(userId);
    removeFromQueue(userId);
    tryMatch();
  }

  function enqueue(userId: string) {
    if (!waitingQueue.has(userId)) {
      waitingQueue.add(userId);
    }
  }

  function removeFromQueue(userId: string) {
    waitingQueue.delete(userId);
  }

  function tryMatch() {
    const queueArray = Array.from(waitingQueue);
    const buckets = new Map<string, ClientData[]>();

    for (const userId of queueArray) {
      const client = clients.get(userId);
      if (!client || client.inRoom) continue;

      const { matchType, language } = client.preferences;
      const bucketKey = `${matchType}|${language ?? ''}`;

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, []);
      }
      buckets.get(bucketKey)!.push(client);
    }

    for (const [, group] of buckets.entries()) {
      for (let i = 0; i < group.length; i++) {
        const a = group[i];
        if (!a || a.inRoom) continue;

        for (let j = i + 1; j < group.length; j++) {
          const b = group[j];
          if (!b || b.inRoom) continue;

          if (canMatch(a, b)) {
            const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            a.roomId = b.roomId = roomId;
            a.inRoom = b.inRoom = true;

            waitingQueue.delete(a.userId);
            waitingQueue.delete(b.userId);

            sendMessage(a.ws, {
              type: 'matched',
              roomId,
              peerId: b.userId,
              peerUsername: b.username,
            });

            sendMessage(b.ws, {
              type: 'matched',
              roomId,
              peerId: a.userId,
              peerUsername: a.username,
            });

            return tryMatch(); // Continue matching others
          }
        }
      }
    }
  }

  function canMatch(a: ClientData, b: ClientData): boolean {
    if (a.preferences.matchType !== b.preferences.matchType) return false;

    // Language must match (unchanged)
    if (a.preferences.language && b.preferences.language) {
      if (a.preferences.language !== b.preferences.language) return false;
    } else if (a.preferences.language || b.preferences.language) {
      return false;
    }

    // Nationality (modified): a.pref vs b.profile AND b.pref vs a.profile
    if (
      a.preferences.nationality &&
      a.preferences.nationality !== b.profileNationality
    ) return false;

    if (
      b.preferences.nationality &&
      b.preferences.nationality !== a.profileNationality
    ) return false;

    switch (a.preferences.matchType) {
      case 'random':
        return true;
      case 'similar':
        return (
          a.ideologicalStance === b.ideologicalStance &&
          a.personalityType === b.personalityType
        );
      case 'opposite':
        return a.ideologicalStance !== b.ideologicalStance;
      case 'topic':
        return a.preferences.topics.some((aTopic) =>
          b.preferences.topics.some(
            (bTopic) =>
              aTopic.topic === bTopic.topic && aTopic.stance !== bTopic.stance
          )
        );
      default:
        return false;
    }
  }

  function broadcastToRoom(roomId: string, sender: WebSocket, message: string) {
    for (const client of clients.values()) {
      if (client.roomId === roomId && client.ws !== sender) {
        sendMessage(client.ws, { type: 'chat', message });
      }
    }
  }

  return {
    addClient,
    removeClient,
    getUserIdByWs,
  };
}
