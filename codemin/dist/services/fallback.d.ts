export interface FallbackStatus {
    totalRamGB: number;
    recommendedModel: string;
    currentModel: string;
    usingFallback: boolean;
    reason?: string;
}
export declare class FallbackService {
    getTotalRamGB(): number;
    needsFallback(): boolean;
    getRecommendedModel(): string;
    getStatus(): Promise<FallbackStatus>;
    applyFallback(): Promise<boolean>;
    switchModel(modelName: string): Promise<boolean>;
}
export declare const fallbackService: FallbackService;
//# sourceMappingURL=fallback.d.ts.map