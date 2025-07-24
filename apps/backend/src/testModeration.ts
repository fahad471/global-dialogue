// src/testModeration.ts
import { moderateAndAnalyzeMessage } from './matchmaker/moderateAndAnalyze';
import 'dotenv/config';

(async () => {
  const text = 'You are a stupid loser.';
  const result = await moderateAndAnalyzeMessage(text);
  console.log('FINAL RESULT:', result);
  console.log('PERSPECTIVE_API_KEY:', process.env.PERSPECTIVE_API_KEY);
})();
