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
    const userId = matchmaker.getUserIdByWs(ws);
    if (!userId) {
      ws.send(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    if (parsed.type !== 'chat' || typeof parsed.message !== 'string') {
      return; // ignore non-chat messages
    }

    const text = parsed.message.trim();
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
