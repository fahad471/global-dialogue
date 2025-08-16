import WebSocket from 'ws';
import { createMatchmaker } from '../matchmaker/matchmaker'; // your main code
import { generateMockUsers } from './mockUsers';

const NUM_USERS = 100000; // adjust for load test
const clients: WebSocket[] = [];



// const matchmaker = createMatchmaker();

// Function to simulate a client connecting and initializing
function simulateClient(userId: string) {
  const ws = new WebSocket('ws://localhost:8080'); // Replace with your server
  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'init',
      userId
    }));
  });

  ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    if (data.type === 'matched') {
      // Simulate chat messages
      ws.send(JSON.stringify({
        type: 'chat',
        message: `Hello from ${userId}`
      }));
    }
  });

  ws.on('close', () => {
    console.log(`${userId} disconnected`);
  });

  clients.push(ws);
}

// Simulate all users connecting with a delay to avoid immediate overload
for (let i = 0; i < NUM_USERS; i++) {
  setTimeout(() => simulateClient(`user-${i}`), i * 5); // stagger connections
}
