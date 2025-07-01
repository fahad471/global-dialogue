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
import WebSocket, { WebSocketServer } from 'ws';
import { createMatchmaker } from './matchmaker';


const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const wss = new WebSocketServer({ port: PORT });
const matchmaker = createMatchmaker();

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Attach to matchmaker
  matchmaker.addClient(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    matchmaker.removeClient(ws);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
