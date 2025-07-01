import WebSocket from 'ws';

type ClientData = {
  ws: WebSocket;
  userId: string;
  preferences: {
    matchType: 'similar' | 'opposite' | 'random' | 'topic';
    topics: string[];
  };
  inRoom: boolean;
  roomId?: string;
};

export function createMatchmaker() {
  const clients = new Map<WebSocket, ClientData>();
  const waitingQueue: ClientData[] = [];

  function addClient(ws: WebSocket) {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'init') {
          // Initialize client data on connection
          const clientData: ClientData = {
            ws,
            userId: data.userId,
            preferences: data.preferences,
            inRoom: false,
          };
          clients.set(ws, clientData);
          enqueue(clientData);
          tryMatch();
        } else if (data.type === 'chat') {
          // Relay chat to room members
          broadcastToRoom(clients.get(ws)?.roomId || '', ws, data.message);
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });
  }

  function removeClient(ws: WebSocket) {
    const client = clients.get(ws);
    if (client) {
      // Remove from queue if waiting
      const index = waitingQueue.indexOf(client);
      if (index !== -1) waitingQueue.splice(index, 1);

      // If in room, notify and remove room
      if (client.inRoom && client.roomId) {
        broadcastToRoom(client.roomId, ws, '__user_left__');
        // Clean up room members
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
  }

  function enqueue(client: ClientData) {
    if (!waitingQueue.includes(client)) waitingQueue.push(client);
  }

  function tryMatch() {
    while (waitingQueue.length >= 2) {
      // Naive match: pop first two clients for demo
      const c1 = waitingQueue.shift()!;
      const c2 = waitingQueue.shift()!;

      // Ideally here match by preferences - simplified to any two for MVP

      const roomId = `room-${Date.now()}`;

      c1.roomId = roomId;
      c1.inRoom = true;
      c2.roomId = roomId;
      c2.inRoom = true;

      sendMessage(c1.ws, { type: 'matched', roomId, peerId: c2.userId });
      sendMessage(c2.ws, { type: 'matched', roomId, peerId: c1.userId });
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
