// A single turn in the conversation history sent to/received from Gemini.
export interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
}

// Raw shape returned by the model for one compliment.
export interface ComplimentResult {
  compliment: string;
  rulesApplied: number[];
}

// Shape returned by the initial generation call.
export interface InitialGenerationResponse {
  compliments: ComplimentResult[];
}

// Outcome of running rules 5 and 6 against the actual compliment text,
// used to override the model's self-reported claims where we can verify them.
export interface ClientValidation {
  wordCount: number;
  rule5Passed: boolean; // <= 40 words
  rule6Passed: boolean; // no "literally"
}

// Full state for a single compliment card, including its own escalation
// history so each card can be amplified independently of the others.
export interface CardState {
  id: string;
  compliment: string;
  modelRulesApplied: number[];
  validation: ClientValidation;
  hypeLevel: number; // 1 = original, 2+ = escalations
  history: ConversationMessage[];
  isEscalating: boolean;
  escalationError: string | null;
  copyState: 'idle' | 'copied';
}
