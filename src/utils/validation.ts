import type { ClientValidation } from '../types';

// Rules 5 and 6 can be checked deterministically, so we never trust the
// model's self-report for them — we recompute and let this override "rulesApplied".
export function validateCompliment(compliment: string): ClientValidation {
  const wordCount = compliment.trim().split(/\s+/).filter(Boolean).length;
  const rule5Passed = wordCount <= 40;
  const rule6Passed = !/\bliterally\b/i.test(compliment);

  return { wordCount, rule5Passed, rule6Passed };
}

// Merges the model's self-reported rules with the client-verified result for
// rules 5 and 6, so the UI always reflects ground truth for those two.
export function mergeRulesApplied(modelRulesApplied: number[], validation: ClientValidation): number[] {
  const merged = new Set(modelRulesApplied.filter((rule) => rule !== 5 && rule !== 6));
  if (validation.rule5Passed) merged.add(5);
  if (validation.rule6Passed) merged.add(6);
  return Array.from(merged).sort((a, b) => a - b);
}
