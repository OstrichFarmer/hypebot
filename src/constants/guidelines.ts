// Compliment Style Guidelines (Brand Team, v2.1)
// Single source of truth: referenced by prompt construction (utils/gemini.ts)
// and by the UI (components/RulesDisplay.tsx) so the two never drift apart.
export interface Guideline {
  id: number;
  text: string;
  shortLabel: string;
  clientVerifiable: boolean;
}

export const GUIDELINES: Guideline[] = [
  {
    id: 1,
    text: 'Never reference physical appearance in any way',
    shortLabel: 'No physical appearance references',
    clientVerifiable: false,
  },
  {
    id: 2,
    text: "Every compliment must reference the person's specific job title or function",
    shortLabel: 'References job title or function',
    clientVerifiable: false,
  },
  {
    id: 3,
    text: 'Every compliment must include at least one wildly absurd metaphor or comparison',
    shortLabel: 'Contains absurd metaphor',
    clientVerifiable: false,
  },
  {
    id: 4,
    text: 'Every compliment must include one made-up statistic',
    shortLabel: 'Contains made-up statistic',
    clientVerifiable: false,
  },
  {
    id: 5,
    text: 'Maximum 40 words per compliment, no exceptions',
    shortLabel: 'Under 40 words',
    clientVerifiable: true,
  },
  {
    id: 6,
    text: 'The word "literally" is banned',
    shortLabel: 'No use of "literally"',
    clientVerifiable: true,
  },
  {
    id: 7,
    text: 'Never compare the person to a celebrity or any real public figure',
    shortLabel: 'No celebrity comparisons',
    clientVerifiable: false,
  },
  {
    id: 8,
    text: 'All compliments must be workplace appropriate',
    shortLabel: 'Workplace appropriate',
    clientVerifiable: false,
  },
];

export const GUIDELINES_PROMPT_TEXT = GUIDELINES.map((g) => `${g.id}. ${g.text}`).join('\n');
