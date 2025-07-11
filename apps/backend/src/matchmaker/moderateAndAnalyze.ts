import { moderateText, factCheckAndRate } from '../perspectiveClient';

export interface ModerationResult {
  ok: true;
  analysis: {
    fact_check: boolean;     // ✅ fix this
    toxicity: number;
    hate_speech: boolean;    // ✅ fix this
    rating: number;
    reasoning: string;
  };
}

export interface ModerationError {
  ok: false;
  reason: string;
}

export async function moderateAndAnalyzeMessage(text: string): Promise<ModerationResult | ModerationError> {
  // 1. Moderate
  const moderation = await moderateText(text);

  const flagged =
    moderation.toxicity > 100 ||
    moderation.severeToxicity > 100 ||
    moderation.identityAttack > 100 ||
    moderation.insult > 100 ||
    moderation.threat > 100;

  if (flagged) {
    return { ok: false, reason: 'Message rejected by moderation' };
  }

  // 2. Analyze
  const analysis = await factCheckAndRate(text);
  if (!analysis) {
    return { ok: false, reason: 'AI analysis failed' };
  }

  return {
    ok: true,
    analysis: {
      fact_check: analysis.fact_check,
      toxicity: analysis.toxicity,
      hate_speech: analysis.hate_speech,
      rating: analysis.rating,
      reasoning: analysis.reasoning,
    },
  };
}
