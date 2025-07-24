import WebSocket from 'ws';
import 'dotenv/config';
import { createMatchmaker } from './matchmaker/matchmaker';
import { supabaseAdmin as supabase } from './matchmaker/supabaseAdmin';
import { moderateAndAnalyzeMessage } from './matchmaker/moderateAndAnalyze';

const wss = new WebSocket.Server({ port: 8080 });
const matchmaker = createMatchmaker();

wss.on('connection', (ws) => {
  matchmaker.addClient(ws);

  ws.on('message', async (data) => {
    console.log('Received raw message:', data.toString());

    const userId = matchmaker.getUserIdByWs(ws);
    console.log('UserId for this ws:', userId);

    if (!userId) {
      ws.send(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(data.toString());
      console.log('Parsed message:', parsed);
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      console.log('Invalid JSON:', err);
      return;
    }

    // Fix here: check that parsed.message is an object with text string
    if (parsed.type !== 'chat' || typeof parsed.message !== 'object' || typeof parsed.message.text !== 'string') {
      console.log('Ignoring non-chat or invalid message:', parsed);
      return;
    }

    const text = parsed.message.text.trim();
    if (!text) {
      ws.send(JSON.stringify({ error: 'Empty message' }));
      return;
    }

    try {
      const result = await moderateAndAnalyzeMessage(text);

      if (!result.ok) {
        ws.send(JSON.stringify({ error: result.reason }));
        return;
      }

      const { analysis } = result;

      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: userId,
          content: text,
          fact_check: analysis.fact_check,
          toxicity: analysis.toxicity,
          hate_speech: analysis.hate_speech,
          rating: analysis.rating,
          reasoning: analysis.reasoning,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to save message:', error.message);
      }

      const outgoing = JSON.stringify({
        sender: userId,
        text,
        ...analysis,
        timestamp: new Date().toISOString(),
      });

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(outgoing);
        }
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      ws.send(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  ws.on('close', async () => {
    const userId = matchmaker.getUserIdByWs(ws);
    if (userId) {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error) {
        console.error(`Failed to fetch user ${userId}:`, error.message);
      } else {
        console.log(`Disconnected: ${data?.user?.email}`);
      }
      matchmaker.removeClient(userId);
    } else {
      console.error('UserId not found for websocket');
    }
  });
});

console.log('WebSocket server running on ws://localhost:8080');
