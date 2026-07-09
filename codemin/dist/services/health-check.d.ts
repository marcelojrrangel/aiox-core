import type { HealthStatus, HealthDetail } from '../types/index.js';
export declare class HealthChecker {
    checkOllama(): Promise<HealthDetail>;
    checkModel(): Promise<HealthDetail>;
    checkConfigs(): Promise<HealthDetail>;
    checkDiskSpace(): Promise<HealthDetail>;
    checkNodeVersion(): Promise<HealthDetail>;
    checkRam(): Promise<HealthDetail>;
    run(): Promise<HealthStatus>;
    printHealthStatus(status: HealthStatus): void;
}
export declare const healthChecker: HealthChecker;
//# sourceMappingURL=health-check.d.ts.map