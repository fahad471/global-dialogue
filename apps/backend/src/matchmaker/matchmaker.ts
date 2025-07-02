import WebSocket from 'ws';
import { supabase } from './supabaseClient';

type ClientData = {
  ws: WebSocket;
  userId: string;
  preferences: {
    matchType: 'similar' | 'opposite' | 'random' | 'topic';
    topics: string[];
  };
  ideologicalStance?: string;
  personalityType?: string;
  coreBeliefs?: string[];
  inRoom: boolean;
  roomId?: string;
};

export function createMatchmaker() {
  const clients = new Map<WebSocket, ClientData>();
  const waitingQueue: ClientData[] = [];

  // async function addClient(ws: WebSocket) {
  //   ws.on('message', async (message) => {
  //     try {
  //       const data = JSON.parse(message.toString());

  //       if (data.type === 'init') {
  //         const userId = data.userId;

  //         // Fetch profile + nested user_match_preferences + user_selected_topics
  //         const { data: profileData, error: profileError } = await supabase
  //           .from('profiles')
  //           .select(`
  //             ideological_stance,
  //             personality_type,
  //             core_beliefs,
  //             user_match_preferences ( preferred_match_type ),
  //             user_selected_topics ( topic:topic_id )
  //           `)
  //           .eq('id', userId)
  //           .single();

  //         if (profileError || !profileData) {
  //           console.error('Error fetching profile data:', profileError);
  //           return;
  //         }

  //         // Extract preferred_match_type safely from nested user_match_preferences array
  //         const preferredMatchType = profileData.user_match_preferences?.[0]?.preferred_match_type || 'random';

  //         console.log('Loaded profileData:', JSON.stringify(profileData, null, 2));
  //         console.log('Loaded preferredMatchType:', preferredMatchType);

  //         // Build client data
  //         const clientData: ClientData = {
  //           ws,
  //           userId,
  //           preferences: {
  //             matchType: preferredMatchType,
  //             topics: profileData.user_selected_topics?.map((t: any) => t.topic) || [],
  //           },
  //           ideologicalStance: profileData.ideological_stance,
  //           personalityType: profileData.personality_type,
  //           coreBeliefs: profileData.core_beliefs,
  //           inRoom: false,
  //         };

  //         clients.set(ws, clientData);
  //         enqueue(clientData);
  //         tryMatch();
  //       }

  //       else if (data.type === 'chat') {
  //         const sender = clients.get(ws);
  //         if (sender?.roomId) {
  //           broadcastToRoom(sender.roomId, ws, data.message);
  //         }
  //       }
  //     } catch (err) {
  //       console.error('Error processing message:', err);
  //     }
  //   });
  // }
  async function addClient(ws: WebSocket) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'init') {
          const userId = data.userId;

          // 1. Fetch profile + user_selected_topics
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select(`
              ideological_stance,
              personality_type,
              core_beliefs,
              user_selected_topics ( topic:topic_id )
            `)
            .eq('id', userId)
            .single();

          if (profileError || !profileData) {
            console.error('Error fetching profile data:', profileError);
            return;
          }
          console.log('Querying user_match_preferences for userId:', userId);
          
          // 2. Fetch preferred_match_type separately
          const { data: prefData, error: prefError } = await supabase
            .from('user_match_preferences')
            .select('preferred_match_type')
            .eq('id', userId)
            .maybeSingle();

          console.log('prefData raw:', prefData);
          console.log('prefError:', prefError);


          if (prefError) {
            console.error('Error fetching user match preferences:', prefError);
          }

          // fallback to 'random' if no preference found
          const preferredMatchType = prefData?.preferred_match_type || 'random';

          console.log('Loaded profileData:', JSON.stringify(profileData, null, 2));
          console.log('Loaded preferredMatchType:', preferredMatchType);

          // Build client data
          const clientData: ClientData = {
            ws,
            userId,
            preferences: {
              matchType: preferredMatchType,
              topics: profileData.user_selected_topics?.map((t: any) => t.topic) || [],
            },
            ideologicalStance: profileData.ideological_stance,
            personalityType: profileData.personality_type,
            coreBeliefs: profileData.core_beliefs,
            inRoom: false,
          };

          clients.set(ws, clientData);
          enqueue(clientData);
          tryMatch();
        }

        else if (data.type === 'chat') {
          const sender = clients.get(ws);
          if (sender?.roomId) {
            broadcastToRoom(sender.roomId, ws, data.message);
          }
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });
  }




  function removeClient(ws: WebSocket) {
    const client = clients.get(ws);
    if (!client) return;

    const index = waitingQueue.indexOf(client);
    if (index !== -1) waitingQueue.splice(index, 1);

    if (client.inRoom && client.roomId) {
      broadcastToRoom(client.roomId, ws, '__user_left__');

      for (const c of clients.values()) {
        if (c.roomId === client.roomId) {
          c.inRoom = false;
          c.roomId = undefined;
          enqueue(c);
        }
      }
    }

    clients.delete(ws);
  }

  function enqueue(client: ClientData) {
    if (!waitingQueue.includes(client)) waitingQueue.push(client);
  }

  function tryMatch() {
    console.log('Trying to match clients. Queue length:', waitingQueue.length);
    for (let i = 0; i < waitingQueue.length; i++) {
      const a = waitingQueue[i];
      for (let j = i + 1; j < waitingQueue.length; j++) {
        const b = waitingQueue[j];
        if (canMatch(a, b)) {
          waitingQueue.splice(j, 1);
          waitingQueue.splice(i, 1);

          const roomId = `room-${Date.now()}`;
          a.roomId = b.roomId = roomId;
          a.inRoom = b.inRoom = true;

          sendMessage(a.ws, { type: 'matched', roomId, peerId: b.userId });
          sendMessage(b.ws, { type: 'matched', roomId, peerId: a.userId });

          return tryMatch(); // restart loop
        }
      }
    }
  }

  function canMatch(a: ClientData, b: ClientData): boolean {
    if (a.preferences.matchType !== b.preferences.matchType) return false;
    const type = a.preferences.matchType;

    switch (type) {
      case 'random':
        return true;

      case 'similar':
        const similar =
          a.ideologicalStance === b.ideologicalStance &&
          a.personalityType === b.personalityType;

        if (!similar) {
          console.log(`[SKIP] Similar mismatch between ${a.userId} and ${b.userId}`);
        }

        return similar;

      case 'opposite':
        const opposite = a.ideologicalStance !== b.ideologicalStance;

        if (!opposite) {
          console.log(`[SKIP] Opposite mismatch between ${a.userId} and ${b.userId}`);
        }

        return opposite;

      case 'topic':
        const commonTopics = a.preferences.topics.filter(topic =>
          b.preferences.topics.includes(topic)
        );
        const hasTopicMatch = commonTopics.length > 0;

        if (!hasTopicMatch) {
          console.log(`[SKIP] Topic mismatch between ${a.userId} and ${b.userId}`);
        }

        return hasTopicMatch;

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

  function sendMessage(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  return {
    addClient,
    removeClient,
  };
}
