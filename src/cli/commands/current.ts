import chalk from "chalk";
import type { Command } from "commander";
import { loadRoadmap } from "../../services/filesystem.js";
import { getActiveTopic, loadProgress } from "../../services/progress.js";
import { createProgressBar } from "../utils/index.js";

export function registerCurrentCommand(program: Command): void {
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
}
