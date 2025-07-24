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

          // Handle reconnection
          const existingClient = clients.get(userId);
          if (existingClient) {
            console.log(`User ${userId} reconnected, closing old socket`);
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
              user_selected_topics (
                topic:topic_id,
                stance
              )
            `)
            .eq('id', userId)
            .single();

          if (profileError || !profileData) {
            console.error('Error fetching profile data:', profileError);
            sendMessage(ws, { type: 'error', message: 'Profile fetch error' });
            return;
          }

          // Fetch match preferences
          const { data: prefData, error: prefError } = await supabase
            .from('user_match_preferences')
            .select('preferred_match_type, language, nationality')
            .eq('id', userId)
            .maybeSingle();

          if (prefError) {
            console.error('Error fetching user match preferences:', prefError);
          }

          const preferredMatchType = prefData?.preferred_match_type || 'random';

          const clientData: ClientData = {
            ws,
            userId,
            username: profileData.username,
            preferences: {
              matchType: preferredMatchType,
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
            inRoom: false,
          };

          clients.set(userId, clientData);
          enqueue(userId);
          tryMatch();

        } else if (data.type === 'chat') {
          const senderUserId = getUserIdByWs(ws);
          if (!senderUserId) return;

          const sender = clients.get(senderUserId);
          if (sender?.roomId) {
            broadcastToRoom(sender.roomId, ws, data.message);
          }

        } else if (data.type === 'signal') {
          const senderUserId = getUserIdByWs(ws);
          if (!senderUserId) return;
          const sender = clients.get(senderUserId);
          if (!sender || !sender.roomId) return;

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
        console.error('Error processing message:', err);
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
    for (const [userId, client] of clients.entries()) {
      if (client.ws === ws) return userId;
    }
    return undefined;
  }

  function sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
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

    removeFromQueue(userId);
    clients.delete(userId);
    tryMatch();
  }

  function enqueue(userId: string) {
    if (!waitingQueue.has(userId)) {
      waitingQueue.add(userId);
      console.log(`Enqueued client: ${userId}`);
    }
  }

  function removeFromQueue(userId: string) {
    if (waitingQueue.has(userId)) {
      waitingQueue.delete(userId);
      console.log(`Removed client from queue: ${userId}`);
    }
  }

  function tryMatch() {
    console.log('Trying to match clients. Queue length:', waitingQueue.size);
    const queueArray = Array.from(waitingQueue);
    const buckets = new Map<string, ClientData[]>();

    for (const userId of queueArray) {
      const client = clients.get(userId);
      if (!client || client.inRoom) continue;

      const { matchType, language, nationality } = client.preferences;
      const bucketKey = `${matchType}|${language ?? ''}|${nationality ?? ''}`;

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
            // Match found
            waitingQueue.delete(a.userId);
            waitingQueue.delete(b.userId);

            const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            a.roomId = b.roomId = roomId;
            a.inRoom = b.inRoom = true;

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

            return tryMatch();
          }
        }
      }
    }
  }

  function canMatch(a: ClientData, b: ClientData): boolean {
    if (a.preferences.matchType !== b.preferences.matchType) return false;

    const aCriteria = new Set<string>();
    const bCriteria = new Set<string>();

    if (a.preferences.language) aCriteria.add(`language:${a.preferences.language}`);
    if (a.preferences.nationality) aCriteria.add(`nationality:${a.preferences.nationality}`);
    if (b.preferences.language) bCriteria.add(`language:${b.preferences.language}`);
    if (b.preferences.nationality) bCriteria.add(`nationality:${b.preferences.nationality}`);

    if (aCriteria.size > 0 && bCriteria.size > 0) {
      if (aCriteria.size !== bCriteria.size) return false;
      for (const crit of aCriteria) {
        if (!bCriteria.has(crit)) return false;
      }
    } else if (aCriteria.size > 0 || bCriteria.size > 0) {
      return false;
    }

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
        for (const aTopic of a.preferences.topics) {
          for (const bTopic of b.preferences.topics) {
            if (
              aTopic.topic === bTopic.topic &&
              aTopic.stance !== bTopic.stance
            ) {
              return true;
            }
          }
        }
        return false;

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
