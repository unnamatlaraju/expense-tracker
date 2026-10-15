# Spendly · Personal Expense Tracker

A Next.js web app for tracking daily expenses, category budgets and recurring payments. All data is stored in your browser's `localStorage`. There's no backend or account.

The UI uses a dark "Aurora Glass" theme: translucent glass cards, purple → pink → orange gradients and animated background glows. Desktop has a sidebar; phones get a bottom tab bar.

## Features

- **Expenses** (`/`): add expenses with a description, amount (₹), category and date. You can mark an expense as recurring and add your own categories.
- **Add by voice**: tap the mic on the Expenses page and say something like "I spent 1000 on rent" or "200 for snacks yesterday". The app picks out the amount, category, date and description, and shows a preview you confirm before anything is saved. Speech-to-text uses the browser's built-in Web Speech API (Chrome, Edge, Safari; not Firefox), and the glow is [`voice-glow`](https://libraries.dev/voice.html). The mic needs `https` or `localhost`. You can type the sentence instead.
- **Summary** (`/summary`): total and this-month spending, a pie chart by category and a monthly bar chart.
- **Budget** (`/budget`): set a spending limit per category and track progress against it.
- **Recurring** (`/recurring`): pause, resume, delete or "process" recurring expenses (this logs the expense and moves the next due date forward).
- **Reports** (`/reports`): filter by date range and category, then export to CSV or to an HTML report.

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript type check |

## Project structure

| Path | What's in it |
| --- | --- |
| `app/` | One folder per page (route) plus the root layout |
| `components/app-shell.tsx` | Sidebar, mobile top bar, bottom tab bar and animated background |
| `components/views/` | The content of each page |
| `components/ui/` | Base shadcn/ui components, restyled for the theme |
| `lib/store.tsx` | All data and actions (`useExpenseStore`). This is the only file that touches `localStorage` |
| `lib/categories.ts` | Default categories with their icons and colours |
| `lib/format.ts` | Currency and date helpers |
| `lib/voice-parse.ts` | Turns a spoken sentence into amount, category, date and description |
| `components/voice-add.tsx` | The voice card: mic button, glow, and confirm step |

## Tech stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Recharts, lucide-react.
