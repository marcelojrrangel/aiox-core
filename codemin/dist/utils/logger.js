import chalk from 'chalk';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
const LOG_PREFIX = '✦';
export class Logger {
    level;
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }
    setLevel(level) {
        this.level = level;
    }
    debug(...args) {
        if (this.level <= LogLevel.DEBUG) {
            console.log(chalk.gray(LOG_PREFIX), chalk.gray('[debug]'), ...args);
        }
    }
    info(...args) {
        if (this.level <= LogLevel.INFO) {
            console.log(chalk.cyan(LOG_PREFIX), chalk.white(...args));
        }
    }
    success(...args) {
        if (this.level <= LogLevel.INFO) {
            console.log(chalk.green('✓'), ...args);
        }
    }
    warn(...args) {
        if (this.level <= LogLevel.WARN) {
            console.log(chalk.yellow('⚠'), chalk.yellow(...args));
        }
    }
    error(...args) {
        if (this.level <= LogLevel.ERROR) {
            console.error(chalk.red('✗'), chalk.red(...args));
        }
    }
    step(step, total, message) {
        const prefix = chalk.cyan(`[${step}/${total}]`);
        console.log(`\n${prefix} ${chalk.bold(message)}`);
    }
    header(title) {
        const line = '═'.repeat(50);
        console.log(`\n${chalk.cyan(`╔${line}╗`)}`);
        console.log(`${chalk.cyan('║')}  ${chalk.bold(title)}`);
        console.log(`${chalk.cyan(`╚${line}╝`)}`);
    }
    divider() {
        console.log(chalk.gray('─'.repeat(50)));
    }
    progress(percent, message) {
        if (this.level > LogLevel.INFO)
            return;
        const barWidth = 30;
        const filled = Math.round((percent / 100) * barWidth);
        const empty = barWidth - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        process.stdout.write(`\r  ${bar} ${chalk.cyan(`${percent}%`)} ${chalk.gray(message)}`);
        if (percent >= 100)
            process.stdout.write('\n');
    }
}
export const logger = new Logger();
//# sourceMappingURL=logger.js.map