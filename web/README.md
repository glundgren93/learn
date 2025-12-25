# Learn Web Interface

A modern web interface for the AI-powered learning CLI. Features a split-pane lesson editor with theory, Monaco code editor, and test runner.

## Prerequisites

- Node.js 20+
- OpenAI API key

## Setup

### 1. Install dependencies

```bash
cd web
npm install
```

### 2. Configure OpenAI API key

Create a `.env` file in the **project root** (not in `/web`):

```bash
# /learn/.env
OPENAI_API_KEY=sk-your-api-key-here

# Optional: change default model (defaults to gpt-4o)
OPENAI_MODEL=gpt-4o
```

The API server reads from the root `.env` file since it imports shared modules from `../src/`.

### 3. Start the development servers

```bash
npm start
```

This runs both:
- **Vite dev server** at http://localhost:5173 (frontend)
- **Express API** at http://localhost:3001 (backend)

Or run them separately:

```bash
# Terminal 1: API server
npm run server

# Terminal 2: Vite dev server
npm run dev
```

## Project Structure

```
web/
├── src/                    # React frontend
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Router setup
│   ├── pages/
│   │   ├── Dashboard.tsx  # Topic list + create new
│   │   ├── Topic.tsx      # Roadmap view
│   │   └── Lesson.tsx     # Split-pane editor
│   ├── components/
│   │   ├── Header.tsx     # Nav + model selector
│   │   ├── CodeEditor.tsx # Monaco wrapper
│   │   ├── TheoryPanel.tsx # Markdown renderer
│   │   └── ...
│   ├── hooks/             # TanStack Query hooks
│   └── lib/api.ts         # API client
│
├── server/                 # Express API
│   ├── index.ts           # Server entry
│   └── routes/
│       ├── topics.ts      # GET/POST /api/topics
│       ├── roadmap.ts     # GET /api/roadmap/:topic
│       ├── lesson.ts      # GET/POST /api/lesson/:topic/:stageId
│       ├── test.ts        # POST /api/test/:topic/:stageId
│       └── hint.ts        # GET /api/hint/:topic/:stageId/:index
│
├── vite.config.ts         # Vite + Tailwind config
└── tsconfig.json          # TypeScript config
```

## Features

- **Dashboard**: View all topics with progress, create new topics
- **Roadmap**: See all stages with difficulty and progress status
- **Lesson Editor**: 
  - Left panel: Theory (markdown with syntax highlighting)
  - Right panel: Monaco editor + test runner
  - Bottom bar: Stage progress dots + hint button
- **Model Selector**: Switch between GPT-4o, GPT-4o-mini, GPT-4-turbo, or custom

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/topics` | GET | List all topics with progress |
| `/api/topics` | POST | Create new topic (generates roadmap) |
| `/api/roadmap/:topic` | GET | Get roadmap for topic |
| `/api/lesson/:topic/:stageId` | GET | Get lesson content |
| `/api/lesson/:topic/:stageId` | POST | Generate new lesson |
| `/api/test/:topic/:stageId` | POST | Run tests with code |
| `/api/hint/:topic/:stageId/:index` | GET | Get progressive hint |

## Tech Stack

- **Frontend**: React 19, Vite, TanStack Query, React Router 7
- **Styling**: Tailwind CSS 4 (Catppuccin Mocha theme)
- **Editor**: Monaco Editor
- **Backend**: Express 5, Zod validation
- **Shared**: Types and services from `../src/`

