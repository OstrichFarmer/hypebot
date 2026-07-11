# HypeBot 🎉

**Live:** [hypebot-jet.vercel.app](https://hypebot-jet.vercel.app)

I built HypeBot as an AI-powered compliment generator that creates absurdly over-the-top, wildly enthusiastic compliments for any job title or person description. Type in "Customer Success Manager" or "my coworker who always fixes the coffee machine" and it hypes them up like they just saved humanity.

## Features

- **Three distinct compliments per request** — each targets a different angle (industry impact, raw talent, effect on coworkers) instead of returning three reworded versions of the same idea.
- **"Make It More Dramatic" escalation** — each card maintains its own conversation history, so escalating one compliment amplifies it in context without touching the other two.
- **Copy to clipboard** and **share** (native share sheet on mobile, clipboard fallback on desktop) on every card.
- **Brand guideline enforcement** — every compliment is checked against 8 style rules, with the results displayed as a collapsible compliance badge on each card.
- **Mobile-responsive design** — single-column stack on mobile, three-column grid on desktop, with equal-height cards and bottom-aligned action buttons.

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Vite
- Gemini 2.5 Flash API

## Running Locally

1. Clone the repo
2. `npm install`
3. Create a `.env` file with:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. `npm run dev`

## Brand Guidelines

Every compliment HypeBot generates is checked against these 8 rules (Brand Team, v2.1):

1. Never reference physical appearance in any way
2. Every compliment must reference the person's specific job title or function
3. Every compliment must include at least one wildly absurd metaphor or comparison
4. Every compliment must include one made-up statistic
5. Maximum 40 words per compliment, no exceptions
6. The word "literally" is banned
7. Never compare the person to a celebrity or any real public figure
8. All compliments must be workplace appropriate

I don't just trust the model's self-reported compliance. Rules 5 (word count) and 6 (banned word) are independently verified client-side, and that verification overrides whatever the model claims. If a compliment comes back over 40 words, the app automatically asks the model to shorten it before showing it to the user, and if it's still over after retries, the word count badge flags it in red rather than hiding the violation.

## Architecture Decisions

**Independent conversation state per card.** Each compliment card holds its own message history (`{ role, content }[]`), seeded from the shared initial generation exchange. Escalating one card only appends to that card's history and re-renders that card — the other two are untouched, both in state and in their loading/error UI.

**Structured JSON output.** Every Gemini call sets `responseMimeType: 'application/json'` with an explicit `responseSchema`, so the model returns parseable `{ compliment, rulesApplied }` objects instead of free text I'd have to regex out.

**Dual-layer rule validation.** The 8 guidelines are enforced two ways: at the prompt level (baked into the system instruction as hard constraints, with extra emphasis on the 40-word limit since it's the one rule most likely to drift) and again client-side for the two rules that can be checked deterministically. The model's self-report is trusted for the subjective rules (appearance, metaphor, statistic, celebrity, tone) but never for word count or banned words.

**Prompt engineering approach.** The system instruction sets a consistent persona (an enthusiastic hype person who genuinely believes every job is the most important thing humanity has ever created) and locks in all 8 guidelines as non-negotiable constraints. The initial generation prompt explicitly requires three genuinely different angles rather than three variations on one idea. The escalation prompt asks for amplification — more hyperbole, a bigger metaphor, a more absurd statistic — not just a rephrasing, so "Make It More Dramatic" actually feels like turning up a dial.
