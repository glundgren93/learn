/**
 * Project scaffold templates used by the `learn init` command.
 */

export const PACKAGE_JSON_TEMPLATE = (name: string, learnCliDep: string) => ({
	name: name,
	private: true,
	type: 'module',
	scripts: {
		test: 'npx learn run',
		'test:watch': 'vitest',
	},
	devDependencies: {
		'learn-cli': learnCliDep,
		typescript: '^5.9.3',
		vitest: '^4.0.0',
	},
});

export const TSCONFIG_TEMPLATE = {
	compilerOptions: {
		target: 'ES2022',
		module: 'ESNext',
		moduleResolution: 'node',
		strict: true,
		esModuleInterop: true,
		skipLibCheck: true,
		forceConsistentCasingInFileNames: true,
		types: ['node', 'vitest/globals'],
	},
	include: ['**/*.ts'],
	exclude: ['node_modules'],
};

export const VITEST_CONFIG_TEMPLATE = `import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['**/tests/**/*.test.ts'],
	},
});
`;

export const GITIGNORE_TEMPLATE = `node_modules/
.env
`;

export const ENV_EXAMPLE_TEMPLATE = `# Required: Your OpenAI API key
OPENAI_API_KEY=sk-...

# Optional: OpenAI model to use (default: gpt-4o)
# OPENAI_MODEL=gpt-4o
`;

export const README_TEMPLATE = (name: string) => `# ${name}

A learning project created with [learn-cli](https://github.com/your-repo/learn-cli) — an AI-powered CLI for learning programming through progressive, test-driven lessons.

## Setup

1. Create a \`.env\` file with your OpenAI API key:

\`\`\`bash
OPENAI_API_KEY=sk-...
\`\`\`

2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

## Usage

### Starting a New Topic

\`\`\`bash
npx learn start queues           # Learn about queues
npx learn start binary-trees     # Learn about binary trees
npx learn start aws-sqs          # Learn AWS SQS
\`\`\`

### Learning Flow

\`\`\`bash
npx learn continue               # Generate the next lesson
# Edit the solution.ts file in the generated stage folder
npx learn run                    # Run tests to check your solution
npx learn run --stage stage-2    # Rerun tests for a specific stage
npx learn hint                   # Get hints if you're stuck
npx learn ask                    # Open AI chat to discuss the current stage
npx learn current                # View current stage info and files
\`\`\`

### Managing Progress

\`\`\`bash
npx learn status                 # See progress for all topics
npx learn switch                 # Interactive topic selector
npx learn switch queues          # Switch directly to a specific topic
\`\`\`

## Commands Reference

| Command | Description |
|---------|-------------|
| \`npx learn start <topic>\` | Start a new learning path |
| \`npx learn continue [topic]\` | Generate/continue to the next lesson |
| \`npx learn run [topic]\` | Run tests for the current stage |
| \`npx learn run --stage <id>\` | Run tests for a specific stage |
| \`npx learn hint [topic]\` | Get progressive hints |
| \`npx learn ask [topic]\` | Open interactive AI chat |
| \`npx learn current\` | Show current topic, stage info, and files |
| \`npx learn status\` | Show progress for all topics |
| \`npx learn switch [topic]\` | Switch active topic |

## How It Works

1. **Start a topic** — AI generates a 6-8 stage roadmap from basics to a real-world project
2. **Continue to a stage** — AI generates theory, tests, starter code, and hints
3. **Implement your solution** — Edit \`solution.ts\` in the stage folder
4. **Run tests** — Pass all tests to unlock the next stage
5. **Repeat** — Progress through all stages until completion

## Project Structure

\`\`\`
${name}/
├── .env                          # Your OpenAI API key (create this!)
├── package.json
├── queues/                       # A topic you're learning
│   ├── roadmap.json              # Generated learning roadmap
│   ├── progress.json             # Your progress tracking
│   └── stages/
│       └── basic-queue/          # A stage
│           ├── README.md         # Theory and explanation
│           ├── solution.ts       # Your code (edit this!)
│           ├── hints.json        # Progressive hints
│           └── tests/
│               └── solution.test.ts  # Tests to pass
\`\`\`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`OPENAI_API_KEY\` | Your OpenAI API key (required) | — |
| \`OPENAI_MODEL\` | OpenAI model to use | \`gpt-4o\` |

## Editor Settings (Optional)

To have README files open in preview mode in VS Code/Cursor:

\`\`\`json
"workbench.editorAssociations": {
  "**/*.md": "vscode.markdown.preview.editor"
}
\`\`\`
`;

