import type { Command } from "commander";

export function registerCompletionCommand(program: Command): void {
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
