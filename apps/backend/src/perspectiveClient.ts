const API_KEY = process.env.PERSPECTIVE_API_KEY; // Keep your API key secure
const API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

const requestedAttributes = {
  TOXICITY: {},
  SEVERE_TOXICITY: {},
  IDENTITY_ATTACK: {},
  INSULT: {},
  PROFANITY: {},
  THREAT: {},
};

export async function analyzePerspective(text: string) {
  const response = await fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comment: { text },
      languages: ['en'],
      requestedAttributes,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perspective API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.attributeScores;
}

export async function moderateText(text: string) {
  const scores = await analyzePerspective(text);
  return {
    toxicity: scores.TOXICITY.summaryScore.value,
    severeToxicity: scores.SEVERE_TOXICITY.summaryScore.value,
    identityAttack: scores.IDENTITY_ATTACK.summaryScore.value,
    insult: scores.INSULT.summaryScore.value,
    profanity: scores.PROFANITY.summaryScore.value,
    threat: scores.THREAT.summaryScore.value,
  };
}

export async function factCheckAndRate(text: string) {
  const scores = await moderateText(text);

  const hateSpeech = scores.identityAttack > 0.7 || scores.threat > 0.7;
  const toxicity = scores.toxicity;

  const rating = Math.max(0, 10 - toxicity * 10);

  const fact_check = false; // Real fact-checking not implemented

  const reasoning = `Toxicity level at ${toxicity.toFixed(2)}; hate speech detected: ${hateSpeech}. Fact-checking not supported.`;

  return {
    fact_check,
    toxicity,
    hate_speech: hateSpeech,
    rating,
    reasoning,
  };
}
