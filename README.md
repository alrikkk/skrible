IN DEVELOPMENT
# Skrible

Skrible is a student note and meal untangler. It turns messy lecture audio, scribbled notes, whiteboard photos, and dorm fridge contents into clean study summaries, flashcards, and budget-friendly recipes.

**This project is a work in progress.** Features, design, and functionality are actively changing and should not be treated as final or production-stable.

## What it does

Skrible has two core modes:

- **Note Engine** — takes lecture audio, scribbled notes, whiteboard photos, or textbook pages and outputs a structured summary: the big idea, critical takeaways, and key vocabulary. Can also generate study flashcards from any note.
- **Dorm Chef** — takes a grocery receipt, fridge photo, or list of ingredients (plus an optional budget) and outputs a recipe that makes the most of what's available, with a cost breakdown.

Mode detection is automatic by default, but can be set manually.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Express (backend server)
- Google Gemini API (via `@google/genai`) for note/recipe generation, flashcards, and text-to-speech
- Supabase for authentication and data storage

## Getting started

### Prerequisites

- Node.js
- A Google Gemini API key
- A Supabase project (URL and anon key)

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in:
   - `GEMINI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Run the dev server:
   ```
   npm run dev
   ```

## Project structure

```
src/
  components/     UI components (hero, login, input panel, output view, etc.)
  context/        Auth context (Supabase session handling)
  data/           Preset sample scenarios
  lib/            Supabase client setup
server.ts         Express backend — handles Gemini API calls and Notion export
```

## Current status

Skrible is under active development. Known areas still being worked on:

- Server-side request authentication and per-user usage limits
- Persistent, account-linked history (currently local to the browser in some flows)
- Phone number sign-in is a lightweight, non-verified option, not a fully verified auth method
- Google sign-in is not currently enabled
- General design and UX are still being iterated on

## License

Not yet determined.
