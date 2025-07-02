// import express from 'express'
// import cors from 'cors'
// import dotenv from 'dotenv'

// dotenv.config()

// const app = express()
// const PORT = process.env.PORT || 3000

// app.use(cors())
// app.use(express.json())

// app.get('/', (req, res) => {
//   res.send('Backend is running!')
// })

// app.listen(PORT, () => {
//   console.log(`Server is listening on port ${PORT}`)
// })
import WebSocket from 'ws';
import 'dotenv/config';
import { createMatchmaker } from './matchmaker/matchmaker';

const wss = new WebSocket.Server({ port: 8080 });
const matchmaker = createMatchmaker();

wss.on('connection', (ws) => {
  matchmaker.addClient(ws);

ws.on('close', () => {
  const userId = matchmaker.getUserIdByWs(ws);
  if (userId) {
    matchmaker.removeClient(userId);
  } else {
    console.error('UserId not found for websocket');
  }
});
});

console.log('WebSocket server running on ws://localhost:8080');
