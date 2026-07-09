import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_PREFIX = '✦';

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(LOG_PREFIX), chalk.gray('[debug]'), ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.cyan(LOG_PREFIX), chalk.white(...args));
    }
  }

  success(...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.green('✓'), ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.log(chalk.yellow('⚠'), chalk.yellow(...args));
    }
  }

  error(...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red('✗'), chalk.red(...args));
    }
  }

  step(step: number, total: number, message: string): void {
    const prefix = chalk.cyan(`[${step}/${total}]`);
    console.log(`\n${prefix} ${chalk.bold(message)}`);
  }

  header(title: string): void {
    const line = '═'.repeat(50);
    console.log(`\n${chalk.cyan(`╔${line}╗`)}`);
    console.log(`${chalk.cyan('║')}  ${chalk.bold(title)}`);
    console.log(`${chalk.cyan(`╚${line}╝`)}`);
  }

  divider(): void {
    console.log(chalk.gray('─'.repeat(50)));
  }

  progress(percent: number, message: string): void {
    if (this.level > LogLevel.INFO) return;
    const barWidth = 30;
    const filled = Math.round((percent / 100) * barWidth);
    const empty = barWidth - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r  ${bar} ${chalk.cyan(`${percent}%`)} ${chalk.gray(message)}`);
    if (percent >= 100) process.stdout.write('\n');
  }
}

export const logger = new Logger();
