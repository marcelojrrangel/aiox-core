#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { registerInstallCommand } from './commands/install.js';
import { registerStatusCommand } from './commands/status.js';
import { registerChatCommand } from './commands/chat.js';
import { registerConfigCommand } from './commands/config.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerAutocompleteCommand } from './commands/autocomplete.js';
import { registerRefactorCommand } from './commands/refactor.js';
import { registerDetectBugsCommand } from './commands/detect-bugs.js';
import { registerReviewCommand } from './commands/review.js';
import { registerGenerateTestsCommand } from './commands/generate-tests.js';
import { registerGenerateDocsCommand } from './commands/generate-docs.js';
import { registerUpdateCommand } from './commands/update.js';
import { registerFallbackCommand } from './commands/fallback.js';
import { registerLanguagesCommand } from './commands/languages.js';
import { registerModelCommand } from './commands/model.js';
import { registerContextCommand } from './commands/context.js';
import { registerBenchCommand } from './commands/bench.js';
const program = new Command();
program
    .name('codemin')
    .description(chalk.cyan('CodeMin — Assistente de Codificação LLM Local (CPU-only)'))
    .version('1.0.0');
// MVP Commands
registerInstallCommand(program);
registerStatusCommand(program);
registerChatCommand(program);
registerConfigCommand(program);
registerDoctorCommand(program);
// V2 Commands
registerAutocompleteCommand(program);
registerRefactorCommand(program);
registerDetectBugsCommand(program);
registerReviewCommand(program);
registerGenerateTestsCommand(program);
registerGenerateDocsCommand(program);
registerUpdateCommand(program);
registerFallbackCommand(program);
// V3 Commands
registerLanguagesCommand(program);
registerModelCommand(program);
registerContextCommand(program);
registerBenchCommand(program);
// Default: show help
program.action(() => {
    program.help();
});
// Error handling
program.exitOverride();
try {
    await program.parseAsync(process.argv);
}
catch (error) {
    if (error instanceof Error && 'exitCode' in error) {
        process.exit(error.exitCode);
    }
    console.error(chalk.red('Erro:'), error instanceof Error ? error.message : error);
    process.exit(1);
}
//# sourceMappingURL=index.js.map