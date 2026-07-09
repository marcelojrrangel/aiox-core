export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private level;
    constructor(level?: LogLevel);
    setLevel(level: LogLevel): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    success(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    step(step: number, total: number, message: string): void;
    header(title: string): void;
    divider(): void;
    progress(percent: number, message: string): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map