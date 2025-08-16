import fs from 'fs';
import { mockProfiles, mockPreferences } from './mockSupabase';

export function generateMockUsers(count: number) {
  const ideologies = ['left', 'right', 'centrist', 'anarchist'];
  const personalities = ['INTJ', 'ENFP', 'ISTP', 'INFJ'];
  const topics = ['climate', 'tech', 'economy', 'freedom'];

  for (let i = 0; i < count; i++) {
    const userId = `user-${i}`;

    mockProfiles[userId] = {
      id: userId,
      username: `User${i}`,
      ideological_stance: ideologies[Math.floor(Math.random() * ideologies.length)],
      personality_type: personalities[Math.floor(Math.random() * personalities.length)],
      core_beliefs: ['belief1', 'belief2'],
      nationality: Math.random() > 0.5 ? 'US' : 'UK',
      user_selected_topics: topics.slice(0, 3).map(t => ({
        topic_id: t,
        stance: Math.random() > 0.5 ? 'for' : 'against'
      }))
    };

    mockPreferences[userId] = {
      id: userId,
      preferred_match_type: ['random', 'similar', 'opposite', 'topic'][Math.floor(Math.random() * 4)],
      language: Math.random() > 0.5 ? 'en' : null,
      nationality: Math.random() > 0.5 ? 'US' : null,
    };
  }

  // Save mockProfiles and mockPreferences to JSON files
  fs.writeFileSync('mockProfiles.json', JSON.stringify(mockProfiles, null, 2));
  fs.writeFileSync('mockPreferences.json', JSON.stringify(mockPreferences, null, 2));
  console.log(`Generated ${count} mock users and saved to files.`);
}
