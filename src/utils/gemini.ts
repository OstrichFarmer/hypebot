import { GUIDELINES_PROMPT_TEXT } from '../constants/guidelines';
import { validateCompliment } from './validation';
import type { ConversationMessage, InitialGenerationResponse, ComplimentResult } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// How many times to ask the model to shorten a compliment that slipped past
// the 40-word limit before we give up and flag it in the UI instead.
const MAX_LENGTH_RETRIES = 2;

// System instruction: sets the model's persona and locks in the 8 brand
// guidelines as hard constraints that apply to every output, including escalations.
// The 40-word rule (rule 5) gets extra emphasis here because it's the one
// rule we can verify client-side, so the model has no room to drift on it.
const SYSTEM_INSTRUCTION = `You are HypeBot, the world's most enthusiastic hype person. You genuinely and passionately believe that every single person's job is the most important thing humanity has ever created, and you cannot contain your excitement about it.

You must follow these Compliment Style Guidelines on every single output, without exception:
${GUIDELINES_PROMPT_TEXT}

CRITICAL: Every compliment must be 40 words or fewer. Count your words carefully before responding. This is a hard technical limit, not a suggestion. If a compliment is 41 words or more, it is invalid.

Your compliments must be genuinely funny, surprising, and creative — never generic corporate praise. For every compliment you write, self-report which rule numbers (1-8) it satisfies in a "rulesApplied" array.

Before outputting any compliment, count every word. If it exceeds 40 words, rewrite it shorter. No exceptions.`;

const INITIAL_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    compliments: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          compliment: { type: 'STRING', description: 'Must be 40 words or fewer.' },
          rulesApplied: { type: 'ARRAY', items: { type: 'INTEGER' } },
        },
        required: ['compliment', 'rulesApplied'],
      },
    },
  },
  required: ['compliments'],
};

const ESCALATION_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    compliment: { type: 'STRING', description: 'Must be 40 words or fewer.' },
    rulesApplied: { type: 'ARRAY', items: { type: 'INTEGER' } },
  },
  required: ['compliment', 'rulesApplied'],
};

async function callGemini(
  history: ConversationMessage[],
  responseSchema: object,
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env file.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: history.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HypeBot's brain short-circuited (${response.status}). Try again?`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('HypeBot ran out of words. That has never happened before. Try again?');
  }
  return text;
}

// Builds the initial user prompt: three compliments, each from a genuinely
// different angle (industry impact, raw talent, effect on coworkers, etc).
function buildInitialPrompt(subject: string): string {
  return `Generate three distinct, wildly enthusiastic, slightly unhinged compliments for: "${subject}".

Each of the three compliments must come from a completely different angle — for example, one about their impact on the industry, one about their raw talent, one about how their coworkers must feel just being near them. They must NOT be the same compliment reworded with different adjectives; each should feel genuinely different in substance and focus.

Follow all 8 Compliment Style Guidelines exactly. Return JSON matching the schema.`;
}

// Builds the escalation follow-up prompt: amplify the previous compliment
// significantly (more hyperbole, more dramatic metaphor, bigger fake stat)
// while still obeying all 8 rules. This is appended to that card's own history.
function buildEscalationPrompt(): string {
  return `Take that compliment and amplify it significantly. Turn the volume up: more hyperbole, a more dramatic metaphor, a more absurd made-up statistic. This should feel like a genuine escalation, not just a rephrasing of the same idea. Still follow all 8 Compliment Style Guidelines exactly. Return JSON matching the schema.`;
}

// Asks the model to rewrite a single compliment that came in over the
// 40-word limit. Used as a targeted client-side retry rather than
// re-running the whole generation, so it's fast and doesn't disturb the
// other compliments/cards.
async function regenerateShorter(tooLongCompliment: string): Promise<ComplimentResult> {
  const message = `This compliment is over the 40-word limit: "${tooLongCompliment}". Rewrite it to be 40 words or fewer while keeping the same angle and energy, and make sure it still satisfies all 8 Compliment Style Guidelines exactly. Return JSON matching the schema.`;
  const text = await callGemini([{ role: 'user', content: message }], ESCALATION_RESPONSE_SCHEMA);
  return JSON.parse(text);
}

// Client-side backstop for rule 5: even with the strengthened prompt, the
// model can still overshoot the word count. Retry up to MAX_LENGTH_RETRIES
// times before giving up — the UI will flag it as a violation if it's still
// too long after that.
async function enforceWordLimit(result: ComplimentResult): Promise<ComplimentResult> {
  let current = result;
  for (let attempt = 0; attempt < MAX_LENGTH_RETRIES && !validateCompliment(current.compliment).rule5Passed; attempt++) {
    current = await regenerateShorter(current.compliment);
  }
  return current;
}

export async function generateInitialCompliments(subject: string): Promise<{
  results: ComplimentResult[];
  historyPerCard: ConversationMessage[][];
}> {
  const userMessage = buildInitialPrompt(subject);
  const text = await callGemini([{ role: 'user', content: userMessage }], INITIAL_RESPONSE_SCHEMA);
  const parsed: InitialGenerationResponse = JSON.parse(text);

  if (!parsed.compliments || parsed.compliments.length === 0) {
    throw new Error('HypeBot came up empty. Try again?');
  }

  const finalResults = await Promise.all(parsed.compliments.map(enforceWordLimit));

  // Each card gets its own independent history seeded from the shared
  // initial exchange, so later escalations only affect that one card.
  const historyPerCard = finalResults.map((result) => [
    { role: 'user' as const, content: userMessage },
    { role: 'model' as const, content: JSON.stringify(result) },
  ]);

  return { results: finalResults, historyPerCard };
}

export async function escalateCompliment(
  history: ConversationMessage[],
): Promise<{ result: ComplimentResult; newHistory: ConversationMessage[] }> {
  const userMessage = buildEscalationPrompt();
  const fullHistory = [...history, { role: 'user' as const, content: userMessage }];
  const text = await callGemini(fullHistory, ESCALATION_RESPONSE_SCHEMA);
  const result = await enforceWordLimit(JSON.parse(text) as ComplimentResult);

  const newHistory = [...fullHistory, { role: 'model' as const, content: JSON.stringify(result) }];

  return { result, newHistory };
}
