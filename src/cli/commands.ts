import chalk from "chalk";
import type { Command } from "commander";
import { mkdir, readdir, readFile, writeFile } from "fs/promises";
import inquirer from "inquirer";
import ora from "ora";
import { join } from "path";
import { generateLesson } from "../agent/lesson.js";
import { generateRoadmap } from "../agent/roadmap.js";
import {
	getSolutionPath,
	getTestPath,
	loadRoadmap,
	saveLesson,
	saveRoadmap,
} from "../services/filesystem.js";
import {
	getActiveTopic,
	getAllTopicsProgress,
	incrementAttempts,
	initializeProgress,
	loadProgress,
	markStageComplete,
	setActiveTopic,
} from "../services/progress.js";
import { runTests } from "../services/testRunner.js";

const LEARNING_DIR = process.env.LEARNING_DIR || "./learning";

export function setupCommands(program: Command) {
	// Start command
	program
		.command("start <topic>")
		.description("Start a new learning path for a topic")
		.action(async (topic: string) => {
			const spinner = ora("Generating learning roadmap...").start();

			try {
				// Check if roadmap already exists
				const existingRoadmap = await loadRoadmap(topic);
				if (existingRoadmap) {
					spinner.fail(
						`Topic "${topic}" already exists. Use "learn switch ${topic}" to switch to it.`,
					);
					return;
				}

				// Generate roadmap
				const roadmap = await generateRoadmap(topic);
				await saveRoadmap(topic, roadmap);
				await initializeProgress(topic, roadmap.stages.length);

				// Set as active topic
				await setActiveTopic(topic);

				spinner.succeed("Roadmap generated successfully!");

				console.log(chalk.bold(`\n📚 Learning Path: ${roadmap.topic}`));
				console.log(chalk.gray(roadmap.description));
				console.log(chalk.bold("\nStages:"));
				roadmap.stages.forEach((stage, index) => {
					const icon = stage.isRealWorldProject ? "🎯" : "📝";
					console.log(
						`  ${index + 1}. ${icon} ${stage.title} (${stage.difficulty}) - ${stage.objective}`,
					);
				});

				console.log(
					chalk.bold('\n✨ Run "learn continue" to start the first lesson!'),
				);
			} catch (error) {
				spinner.fail(
					`Failed to generate roadmap: ${error instanceof Error ? error.message : String(error)}`,
				);
				process.exit(1);
			}
		});

	// Switch command
	program
		.command("switch [topic]")
		.description("Switch to a different learning topic")
		.action(async (topic?: string) => {
			const allProgress = await getAllTopicsProgress();

			if (allProgress.length === 0) {
				console.log(
					chalk.red(
						'No learning paths found. Use "learn start <topic>" to begin.',
					),
				);
				return;
			}

			let selectedTopic = topic;

			if (!selectedTopic) {
				// Show interactive topic selection
				const activeTopic = await getActiveTopic();

				const choices = allProgress.map((p) => {
					const completed = Object.values(p.stages).filter(
						(s) => s.status === "completed",
					).length;
					const total = Object.keys(p.stages).length;
					const isActive = p.topic === activeTopic;
					const label = `${p.topic} (${completed}/${total} stages)${isActive ? " ← current" : ""}`;
					return { name: label, value: p.topic };
				});

				const answer = await inquirer.prompt([
					{
						type: "list",
						name: "topic",
						message: "Select a topic to switch to:",
						choices,
					},
				]);
				selectedTopic = answer.topic;
			}

			// Verify topic exists
			const progress = await loadProgress(selectedTopic!);
			if (!progress) {
				console.log(chalk.red(`Topic "${selectedTopic}" not found.`));
				return;
			}

			await setActiveTopic(selectedTopic!);
			console.log(
				chalk.green(
					`✓ Switched to "${selectedTopic}" (Stage ${progress.currentStage})`,
				),
			);
		});

	// Continue command
	program
		.command("continue [topic]")
		.description("Continue to the next lesson (optionally specify topic)")
		.action(async (topicArg?: string) => {
			const progress = await findCurrentTopic(topicArg);
			if (!progress) {
				console.log(
					chalk.red(
						'No active learning path found. Use "learn start <topic>" to begin.',
					),
				);
				return;
			}

			const roadmap = await loadRoadmap(progress.topic);
			if (!roadmap) {
				console.log(
					chalk.red(`Roadmap not found for topic: ${progress.topic}`),
				);
				return;
			}

			const currentStageNum = progress.currentStage;
			const currentStage = roadmap.stages[currentStageNum - 1];

			if (!currentStage) {
				console.log(
					chalk.green("🎉 Congratulations! You've completed all stages!"),
				);
				return;
			}

			const spinner = ora(
				`Generating lesson: ${currentStage.title}...`,
			).start();

			try {
				const lesson = await generateLesson(
					progress.topic,
					currentStage.id,
					currentStageNum,
				);
				await saveLesson(progress.topic, currentStage.id, lesson);

				spinner.succeed("Lesson generated!");

				console.log(
					chalk.bold(`\n📖 Stage ${currentStageNum}: ${currentStage.title}`),
				);
				console.log(chalk.gray(`Objective: ${currentStage.objective}\n`));

				const solutionPath = getSolutionPath(progress.topic, currentStage.id);
				console.log(chalk.bold("📝 Your code:"), solutionPath);
				console.log(
					chalk.bold("🧪 Tests:"),
					getTestPath(progress.topic, currentStage.id),
				);
				console.log(
					chalk.bold("📚 Theory:"),
					`learning/${progress.topic}/stages/${currentStage.id}/README.md`,
				);

				console.log(
					chalk.yellow(
						'\n💡 Tip: Edit solution.ts and run "learn run" to test your code!',
					),
				);
			} catch (error) {
				spinner.fail(
					`Failed to generate lesson: ${error instanceof Error ? error.message : String(error)}`,
				);
				process.exit(1);
			}
		});

	// Status command
	program
		.command("status")
		.description("Show progress across all topics")
		.action(async () => {
			await showStatus();
		});

	// Current command
	program
		.command("current")
		.description("Show the current active topic")
		.action(async () => {
			const activeTopic = await getActiveTopic();

			if (!activeTopic) {
				console.log(
					chalk.yellow('No active topic. Use "learn start <topic>" to begin.'),
				);
				return;
			}

			const progress = await loadProgress(activeTopic);
			const roadmap = await loadRoadmap(activeTopic);

			if (!progress || !roadmap) {
				console.log(chalk.red(`Topic "${activeTopic}" not found.`));
				return;
			}

			const completed = Object.values(progress.stages).filter(
				(s) => s.status === "completed",
			).length;
			const total = Object.keys(progress.stages).length;
			const percentage = Math.round((completed / total) * 100);
			const currentStage = roadmap.stages[progress.currentStage - 1];

			console.log(chalk.bold.cyan(`\n📍 Current Topic: ${activeTopic}\n`));
			console.log(
				`  ${createProgressBar(percentage, 20)} ${completed}/${total} stages (${percentage}%)`,
			);

			if (currentStage) {
				console.log(
					chalk.bold(
						`\n  Stage ${progress.currentStage}: ${currentStage.title}`,
					),
				);
				console.log(chalk.gray(`  ${currentStage.objective}`));
				console.log(chalk.gray(`  Difficulty: ${currentStage.difficulty}`));
			} else {
				console.log(chalk.green("\n  🎉 All stages completed!"));
			}

			console.log(chalk.gray('\n  Use "learn switch" to change topics'));
		});

	// Run command
	program
		.command("run [topic]")
		.description("Run tests for the current stage (optionally specify topic)")
		.action(async (topicArg?: string) => {
			const progress = await findCurrentTopic(topicArg);
			if (!progress) {
				console.log(
					chalk.red(
						'No active learning path found. Use "learn start <topic>" to begin.',
					),
				);
				return;
			}

			const roadmap = await loadRoadmap(progress.topic);
			if (!roadmap) {
				console.log(
					chalk.red(`Roadmap not found for topic: ${progress.topic}`),
				);
				return;
			}

			const currentStageNum = progress.currentStage;
			const currentStage = roadmap.stages[currentStageNum - 1];

			if (!currentStage) {
				console.log(chalk.green("🎉 All stages completed!"));
				return;
			}

			const testPath = getTestPath(progress.topic, currentStage.id);
			const spinner = ora(`Running tests for ${progress.topic}...`).start();

			try {
				await incrementAttempts(progress.topic, currentStageNum);
				const result = await runTests(testPath);

				if (result.passed) {
					spinner.succeed(chalk.green("All tests passed! 🎉"));
					await markStageComplete(progress.topic, currentStageNum);
					console.log(
						chalk.bold(
							'\n✨ Great job! Run "learn continue" for the next lesson.',
						),
					);
				} else {
					spinner.fail(chalk.red("Some tests failed"));
					console.log(chalk.red("\nFailed tests:"));
					result.failedTests.forEach((test) => {
						console.log(chalk.red(`  × ${test}`));
					});
					if (result.errorMessages.length > 0) {
						console.log(chalk.yellow("\nErrors:"));
						result.errorMessages.forEach((msg) => {
							console.log(chalk.yellow(`  ${msg}`));
						});
					}
					console.log(chalk.yellow('\n💡 Tip: Run "learn hint" for help'));
				}
			} catch (error) {
				spinner.fail(
					`Failed to run tests: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		});

	// Hint command
	program
		.command("hint [topic]")
		.description("Get hints for the current stage (optionally specify topic)")
		.action(async (topicArg?: string) => {
			const progress = await findCurrentTopic(topicArg);
			if (!progress) {
				console.log(
					chalk.red(
						'No active learning path found. Use "learn start <topic>" to begin.',
					),
				);
				return;
			}

			const roadmap = await loadRoadmap(progress.topic);
			if (!roadmap) {
				console.log(
					chalk.red(`Roadmap not found for topic: ${progress.topic}`),
				);
				return;
			}

			const currentStageNum = progress.currentStage;
			const currentStage = roadmap.stages[currentStageNum - 1];

			if (!currentStage) {
				console.log(chalk.green("🎉 All stages completed!"));
				return;
			}

			try {
				const hintsPath = `learning/${progress.topic}/stages/${currentStage.id}/hints.json`;
				const hints = JSON.parse(
					await readFile(hintsPath, "utf-8"),
				) as string[];

				console.log(chalk.bold(`\n💡 Hints for: ${currentStage.title}\n`));
				hints.forEach((hint, index) => {
					console.log(chalk.yellow(`${index + 1}. ${hint}`));
				});
			} catch (error) {
				console.log(
					chalk.red(
						`Failed to load hints: ${error instanceof Error ? error.message : String(error)}`,
					),
				);
				console.log(
					chalk.yellow('Make sure you\'ve run "learn continue" first.'),
				);
			}
		});

	// Topics command (alias for status)
	program
		.command("topics")
		.description("List all learning topics")
		.action(async () => {
			await showStatus();
		});

	// Completion command - generates shell completion script
	program
		.command("completion")
		.description("Output shell completion script for zsh")
		.action(() => {
			const script = `###-begin-learn-completion-###
_learn() {
  local -a commands topics

  commands=(
    'start:Start a new learning path for a topic'
    'switch:Switch to a different learning topic'
    'continue:Continue to the next lesson'
    'run:Run tests for the current stage'
    'hint:Get hints for the current stage'
    'status:Show progress across all topics'
    'current:Show the current active topic'
    'topics:List all learning topics'
    'completion:Output shell completion script'
  )

  # Get existing topics from learning directory
  if [[ -d "./learning" ]]; then
    topics=(\${(f)"$(ls -d ./learning/*/ 2>/dev/null | xargs -n1 basename 2>/dev/null)"})
  fi

  _arguments -C \\
    '1: :->command' \\
    '2: :->argument' \\
    && return 0

  case "$state" in
    command)
      _describe -t commands 'learn commands' commands
      ;;
    argument)
      case "$words[2]" in
        switch|continue|run|hint)
          if (( \${#topics[@]} > 0 )); then
            _describe -t topics 'available topics' topics
          else
            _message 'no topics found'
          fi
          ;;
        start)
          _message 'new topic name (e.g., queues, binary-trees, aws-sqs)'
          ;;
        *)
          ;;
      esac
      ;;
  esac
}

compdef _learn learn
###-end-learn-completion-###
`;
			console.log(script);
		});
}

async function showStatus(): Promise<void> {
	const allProgress = await getAllTopicsProgress();
	const activeTopic = await getActiveTopic();

	if (allProgress.length === 0) {
		console.log(
			chalk.yellow(
				'No learning paths found. Use "learn start <topic>" to begin.',
			),
		);
		return;
	}

	console.log(chalk.bold("\n📊 Learning Progress\n"));

	for (const progress of allProgress) {
		const roadmap = await loadRoadmap(progress.topic);
		const completed = Object.values(progress.stages).filter(
			(s) => s.status === "completed",
		).length;
		const total = Object.keys(progress.stages).length;
		const percentage = Math.round((completed / total) * 100);
		const isActive = progress.topic === activeTopic;

		const progressBar = createProgressBar(percentage, 20, isActive);

		// Highlight active topic with cyan background/bold
		if (isActive) {
			console.log(
				chalk.bold.cyan(`▶ ${progress.topic}`) + chalk.cyan(" (active)"),
			);
		} else {
			console.log(chalk.bold(`  ${progress.topic}`));
		}

		console.log(
			`    ${progressBar} ${completed}/${total} stages (${percentage}%)`,
		);

		if (roadmap && progress.currentStage <= roadmap.stages.length) {
			const currentStage = roadmap.stages[progress.currentStage - 1];
			const stageInfo = currentStage
				? `Stage ${progress.currentStage} - ${currentStage.title}`
				: "Complete";
			console.log(chalk.gray(`    Next: ${stageInfo}`));
		} else {
			console.log(chalk.green(`    ✓ Completed!`));
		}
		console.log();
	}
}

function createProgressBar(
	percentage: number,
	width: number,
	isActive = false,
): string {
	const filled = Math.round((percentage / 100) * width);
	const empty = width - filled;
	const color = isActive ? chalk.cyan : chalk.green;
	const filledBar = color("█".repeat(filled));
	const emptyBar = chalk.gray("░".repeat(empty));
	return `[${filledBar}${emptyBar}]`;
}

async function findCurrentTopic(
	topicOverride?: string,
): Promise<{ topic: string; currentStage: number } | null> {
	// If topic is specified, use that
	if (topicOverride) {
		const progress = await loadProgress(topicOverride);
		if (progress) {
			return { topic: progress.topic, currentStage: progress.currentStage };
		}
		return null;
	}

	// Otherwise, use the active topic
	const activeTopic = await getActiveTopic();
	if (activeTopic) {
		const progress = await loadProgress(activeTopic);
		if (progress) {
			return { topic: progress.topic, currentStage: progress.currentStage };
		}
	}

	// Fallback: find any topic with progress
	try {
		const topics = await readdir(LEARNING_DIR, { withFileTypes: true });
		const topicDirs = topics.filter((dirent) => dirent.isDirectory());

		for (const topicDir of topicDirs) {
			const progressPath = join(LEARNING_DIR, topicDir.name, "progress.json");
			try {
				const progress = JSON.parse(await readFile(progressPath, "utf-8"));
				if (progress.currentStage) {
					// Set this as active for future calls
					await setActiveTopic(progress.topic);
					return { topic: progress.topic, currentStage: progress.currentStage };
				}
			} catch {}
		}
		return null;
	} catch {
		return null;
	}
}
