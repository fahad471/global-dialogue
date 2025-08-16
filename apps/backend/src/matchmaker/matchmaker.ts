import WebSocket from 'ws';
import { supabaseAdmin as supabase } from '../test/mockSupabase';
// import { supabaseAdmin as supabase } from './supabaseAdmin';
function generateWaitTimeHistogram(waitTimes: number[], bucketSize = 5) {
  // Find max wait time to define buckets
  const maxTime = Math.max(...waitTimes);
  const numBuckets = Math.ceil(maxTime / bucketSize);
  
  // Initialize buckets
  const histogram = Array(numBuckets).fill(0);

  // Fill buckets
  for (const time of waitTimes) {
    const bucketIndex = Math.floor(time / bucketSize);
    histogram[bucketIndex]++;
  }

  // Build range labels
  const labels = histogram.map((_, i) => `${i * bucketSize}-${(i + 1) * bucketSize}s`);

  return { labels, counts: histogram };
}

// Example usage:


let matchTimes: number[] = [];
let totalMatches = 0;
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
  profileNationality?: string | null;
  inRoom: boolean;
  roomId?: string;
  joinedQueueAt?: number;
};

export function createMatchmaker() {
  const clients = new Map<string, ClientData>();
  const waitingQueue: Set<string> = new Set();
  const rooms = new Map<string, { clients: string[], lastActive: number }>();

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
                topic_id,
                stance
              )
            `)
            .eq('id', userId)
            .single();

          if (profileError || !profileData) {
            console.error(`Profile fetch error for ${userId}`, profileError);
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
            console.error(`Preferences fetch error for ${userId}`, prefError);
          }

          const clientData: ClientData = {
            ws,
            userId,
            username: profileData.username,
            preferences: {
              matchType: prefData?.preferred_match_type || 'random',
              topics: profileData.user_selected_topics?.map((t: any) => ({
                topic: t.topic_id,
                stance: t.stance,
              })) || [],
              language: prefData?.language ?? null,
              nationality: prefData?.nationality ?? null,
            },
            ideologicalStance: profileData.ideological_stance,
            personalityType: profileData.personality_type,
            coreBeliefs: profileData.core_beliefs,
            profileNationality: profileData.nationality ?? null,
            inRoom: false,
          };

          clients.set(userId, clientData);

          // Restore to room if recently disconnected
          for (const [roomId, room] of rooms.entries()) {
            if (room.clients.includes(userId) && Date.now() - room.lastActive < 30000) {
              clientData.roomId = roomId;
              clientData.inRoom = true;
              sendMessage(ws, { type: 'rejoined', roomId });
              return;
            }
          }

          enqueue(userId);
          tryMatch();
        }

        else if (data.type === 'chat') {
          const senderId = getUserIdByWs(ws);
          if (!senderId) return;

          const sender = clients.get(senderId);
          if (sender?.roomId) {
            rooms.set(sender.roomId, { clients: rooms.get(sender.roomId)?.clients || [], lastActive: Date.now() });
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
        console.error(`Error handling message:`, err);
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

      // Cleanup the room if empty after this user leaves
      const room = rooms.get(client.roomId);
      if (room) {
        room.clients = room.clients.filter(id => id !== userId);
        if (room.clients.length === 0) {
          rooms.delete(client.roomId);
        } else {
          rooms.set(client.roomId, room);
        }
      }
    }

    clients.delete(userId);
    removeFromQueue(userId);
    tryMatch();
  }


  function enqueue(userId: string) {
    const client = clients.get(userId);
    if (client) {
      client.joinedQueueAt = Date.now();  // Reset join time on enqueue
    }
    if (!waitingQueue.has(userId)) {
      waitingQueue.add(userId);
    }
  }
  function removeFromQueue(userId: string) {
    if (waitingQueue.delete(userId)) {
      const client = clients.get(userId);
      if (client) {
        client.joinedQueueAt = undefined;  // Clear timestamp when removed from queue
      }
    }
  }

  function logQueue() {
    const usernames = Array.from(waitingQueue)
      .map((id) => clients.get(id)?.username || 'Unknown');
    console.log(`Queue (${waitingQueue.size}): [${usernames.join(', ')}]`);
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
      group.sort((a, b) => {
        const aTime = a.joinedQueueAt ?? Infinity;
        const bTime = b.joinedQueueAt ?? Infinity;
        return aTime - bTime;
      });

      let matched = new Set<string>();

      for (let i = 0; i < group.length; i++) {
        const a = group[i];
        if (!a || a.inRoom || matched.has(a.userId)) continue;

        for (let j = i + 1; j < group.length; j++) {
          const b = group[j];
          if (!b || b.inRoom || matched.has(b.userId)) continue;

          if (canMatch(a, b)) {
            const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            a.roomId = b.roomId = roomId;
            a.inRoom = b.inRoom = true;

            const now = Date.now();
            const waitA = a.joinedQueueAt ? (now - a.joinedQueueAt) / 1000 : 0;
            const waitB = b.joinedQueueAt ? (now - b.joinedQueueAt) / 1000 : 0;
            a.joinedQueueAt = undefined;
            b.joinedQueueAt = undefined;

            removeFromQueue(a.userId);
            removeFromQueue(b.userId);

            rooms.set(roomId, { clients: [a.userId, b.userId], lastActive: now });

            sendMessage(a.ws, { type: 'matched', roomId, peerId: b.userId, peerUsername: b.username });
            sendMessage(b.ws, { type: 'matched', roomId, peerId: a.userId, peerUsername: a.username });

            matchTimes.push(waitA, waitB);
            totalMatches += 2;

            if (totalMatches >= 1000) {
              const sum = matchTimes.reduce((acc, t) => acc + t, 0);
              const avg = sum / matchTimes.length;
              const maxWait = Math.max(...matchTimes);

              // Use fallback "unknown" if username is undefined
              const maxPair: [string, string] = [
                a.username ?? "unknown",
                b.username ?? "unknown"
              ];

              console.log(`📊 After 1000 matches: average wait ${avg.toFixed(2)}s, max wait ${maxWait.toFixed(2)}s between ${maxPair[0]} and ${maxPair[1]}`);
              const result = generateWaitTimeHistogram(matchTimes, 5);
              console.log("Ranges:", result.labels);
              console.log("Counts:", result.counts);

              matchTimes = [];
              totalMatches = 0;
            }

            matched.add(a.userId);
            matched.add(b.userId);
            break;
          }
        }
      }
    }
  }


  // function tryMatch() {
  //   const queueArray = Array.from(waitingQueue);
  //   const buckets = new Map<string, ClientData[]>();

  //   for (const userId of queueArray) {
  //     const client = clients.get(userId);
  //     if (!client || client.inRoom) continue;

  //     const { matchType, language } = client.preferences;
  //     const bucketKey = `${matchType}|${language ?? ''}`;

  //     if (!buckets.has(bucketKey)) {
  //       buckets.set(bucketKey, []);
  //     }
  //     buckets.get(bucketKey)!.push(client);
  //   }

  //   for (const [, group] of buckets.entries()) {
  //     // Shuffle for fairness
  //     for (let i = group.length - 1; i > 0; i--) {
  //       const j = Math.floor(Math.random() * (i + 1));
  //       [group[i], group[j]] = [group[j], group[i]];
  //     }

  //     let matched = new Set<string>();

  //     for (let i = 0; i < group.length; i++) {
  //       const a = group[i];
  //       if (!a || a.inRoom || matched.has(a.userId)) continue;

  //       for (let j = i + 1; j < group.length; j++) {
  //         const b = group[j];
  //         if (!b || b.inRoom || matched.has(b.userId)) continue;

  //         if (canMatch(a, b)) {
  //           const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  //           a.roomId = b.roomId = roomId;
  //           a.inRoom = b.inRoom = true;

  //           const now = Date.now();
  //           // const waitA = a.joinedQueueAt ? ((now - a.joinedQueueAt) / 1000).toFixed(1) : '0';
  //           // const waitB = b.joinedQueueAt ? ((now - b.joinedQueueAt) / 1000).toFixed(1) : '0';
  //           const waitA = a.joinedQueueAt ? ((now - a.joinedQueueAt) / 1000) : 0;
  //           const waitB = b.joinedQueueAt ? ((now - b.joinedQueueAt) / 1000) : 0;
  //           a.joinedQueueAt = undefined;  // Clear timestamp on match
  //           b.joinedQueueAt = undefined;

  //           removeFromQueue(a.userId);
  //           removeFromQueue(b.userId);

  //           rooms.set(roomId, { clients: [a.userId, b.userId], lastActive: Date.now() });

  //           sendMessage(a.ws, {
  //             type: 'matched',
  //             roomId,
  //             peerId: b.userId,
  //             peerUsername: b.username,
  //           });

  //           sendMessage(b.ws, {
  //             type: 'matched',
  //             roomId,
  //             peerId: a.userId,
  //             peerUsername: a.username,
  //           });

  //           // console.log(
  //           //   `✅ Matched: ${a.username} (${a.userId}) waited ${waitA}s ↔ ${b.username} (${b.userId}) waited ${waitB}s in room ${roomId}`
  //           // );
  //         matchTimes.push(waitA, waitB);
  //         totalMatches += 2;

  //         // After every 1000 matches, log stats
  //         if (totalMatches >= 1000) {
  //           const sum = matchTimes.reduce((acc, t) => acc + t, 0);
  //           const avg = sum / matchTimes.length;
  //           const max = Math.max(...matchTimes);
  //           console.log(`📊 After 1000 matches: average wait ${avg.toFixed(2)}s, max wait ${max.toFixed(2)}s`);

  //           // Reset
  //           matchTimes = [];
  //           totalMatches = 0;
  //         }
  //           break; // Move to next `a`
  //         }

  //       }
  //     }
  //   }

  //   // logQueue();
  // }

  function canMatch(a: ClientData, b: ClientData): boolean {
    const waitTimeA = a.joinedQueueAt ? (Date.now() - a.joinedQueueAt) / 1000 : 0;
    const waitTimeB = b.joinedQueueAt ? (Date.now() - b.joinedQueueAt) / 1000 : 0;
    const relax = waitTimeA > 60 || waitTimeB > 60;

    if (!relax && a.preferences.matchType !== b.preferences.matchType) return false;

    if (a.preferences.language && b.preferences.language) {
      if (a.preferences.language !== b.preferences.language) return false;
    }

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
      case 'topic': {
        const matched = a.preferences.topics.some((aTopic) =>
          b.preferences.topics.some((bTopic) => {
            const isMatch =
              aTopic.topic === bTopic.topic &&
              aTopic.stance !== bTopic.stance;

            if (isMatch) {
              // console.log(
              //   `[Topic Match] ${a.username} (${a.userId}) [${aTopic.topic}:${aTopic.stance}] ↔ ${b.username} (${b.userId}) [${bTopic.topic}:${bTopic.stance}]`
              // );
            }

            return isMatch;
          })
        );
        return matched;
      }
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
