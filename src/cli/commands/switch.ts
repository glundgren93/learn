import chalk from "chalk";
import type { Command } from "commander";
import inquirer from "inquirer";
import {
	getActiveTopic,
	getAllTopicsProgress,
	loadProgress,
	setActiveTopic,
} from "../../services/progress.js";

export function registerSwitchCommand(program: Command): void {
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
}
