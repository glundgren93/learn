# Learn CLI

An AI-powered CLI tool for learning programming concepts through progressive, test-driven lessons. Select a topic, receive a personalized roadmap, and work through stages by making tests pass.

## Features

- 🤖 **AI-Generated Content** — OpenAI generates roadmaps, theory, tests, and hints
- 🧪 **Test-Driven Learning** — Each stage has tests you must pass to progress
- 📈 **Progressive Difficulty** — Stages build on each other, from basics to real-world projects
- 🔄 **Multi-Topic Support** — Learn multiple topics and switch between them
- 💡 **Built-in Hints** — Get progressive hints when you're stuck

## Installation

```bash
npm install
npm run build
npm link  # Makes `learn` command available globally
```

## Setup

1. Copy `.env.example` to `.env`
2. Add your OpenAI API key: `OPENAI_API_KEY=sk-...`
3. Run `npm run build` to compile TypeScript
4. Use `npm link` to install the CLI globally

## Usage

### Starting a New Topic

```bash
learn start queues           # Start learning about queues
learn start binary-trees     # Start learning about binary trees
learn start aws-sqs          # Learn AWS SQS
```

### Learning Flow

```bash
learn continue               # Generate the next lesson for current topic
# Edit the solution.ts file in the generated stage folder
learn run                    # Run tests to check your solution
learn run --stage stage-2    # Rerun tests for a specific stage
learn hint                   # Get hints if you're stuck
```

### Viewing Stage Files

```bash
learn files                  # List files for current stage (clickable paths)
```

### Managing Multiple Topics

```bash
learn status                 # See progress for all topics
learn switch                 # Interactive topic selector
learn switch queues          # Switch directly to a specific topic
```

### Running Commands for Specific Topics

All commands accept an optional topic argument:

```bash
learn continue queues        # Continue the queues topic
learn run aws-sqs            # Run tests for aws-sqs topic
learn hint binary-trees      # Get hints for binary-trees topic
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `learn start <topic>` | Start a new learning path |
| `learn continue [topic]` | Generate/continue to the next lesson |
| `learn run [topic]` | Run tests for the current stage |
| `learn run --stage <id>` | Run tests for a specific stage (e.g., `stage-2` or `linked-list-queue-impl`) |
| `learn hint [topic]` | Get progressive hints |
| `learn files` | List files for current stage (clickable in terminal) |
| `learn status` | Show progress for all topics |
| `learn switch [topic]` | Switch active topic |
| `learn topics` | Alias for `learn status` |

## How It Works

1. **Start a topic** — AI generates a 6-8 stage roadmap from basics to a real-world project
2. **Continue to a stage** — AI generates theory, tests, starter code, and hints
3. **Implement your solution** — Edit `solution.ts` in the stage folder
4. **Run tests** — Pass all tests to unlock the next stage
5. **Repeat** — Progress through all stages until completion

## Project Structure

```
learning/
└── queues/                    # Your topic
    ├── roadmap.json           # Generated learning roadmap
    ├── progress.json          # Your progress tracking
    └── stages/
        └── basic-queue/       # A stage
            ├── README.md      # Theory and explanation
            ├── solution.ts    # Your code (edit this!)
            ├── hints.json     # Progressive hints
            └── tests/
                └── solution.test.ts  # Tests to pass
```

## Shell Completion

Enable smart autocompletion for zsh:

```bash
# Add to your ~/.zshrc
eval "$(learn completion)"
```

This provides:
- Tab completion for all commands (`start`, `switch`, `run`, etc.)
- Smart topic suggestions for `switch`, `continue`, `run`, and `hint` commands
- Lists your existing topics from the `learning/` directory

After adding to your `.zshrc`, restart your shell or run `source ~/.zshrc`.

## Development

```bash
make install     # Install dependencies
make build       # Build TypeScript
make test        # Run tests
make dev         # Run in development mode
make format      # Format code with Prettier
make lint        # Lint code with ESLint
make check       # Check formatting and linting
make fix         # Auto-fix issues
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key (required) | — |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o` |
| `LEARNING_DIR` | Directory for generated content | `./learning` |

## License

MIT
