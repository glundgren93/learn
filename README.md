# Learn CLI

An AI-powered CLI tool for learning programming concepts through progressive, test-driven lessons.

## Installation

```bash
npm install
npm run build
npm link  # Makes `learn` command available globally
```

## Usage

```bash
# Start learning a new topic
learn start queues

# Continue to the next lesson
learn continue

# Check your progress
learn status

# Run tests for current stage
learn run

# Get hints for current stage
learn hint
```

## Setup

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key: `OPENAI_API_KEY=sk-...`
3. Run `npm run build` to compile TypeScript
4. Use `npm link` to install the CLI globally

## Development

```bash
npm run dev    # Run in development mode
npm test       # Run tests
npm run build  # Build for production
```

