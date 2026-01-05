// Token usage tracking service
// Simple in-memory storage for demonstration purposes

interface TokenUsage {
  timestamp: number;
  service: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface UsageStats {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  serviceBreakdown: Record<string, number>;
  modelBreakdown: Record<string, number>;
  requestCount: number;
  usageHistory: TokenUsage[];
}

// TODO: Replace in-memory storage with persistent storage (e.g., database, file system)
// Current implementation uses in-memory storage which will be lost on server restart
// In-memory storage
let usageHistory: TokenUsage[] = [];

/**
 * Estimate token count from text
 * Simple estimation: ~4 characters per token for English, ~1.5 characters per token for Chinese
 */
function estimateTokens(text: string): number {
  if (!text) return 0;

  // Count Chinese characters (CJK unified ideographs)
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  // Count other characters
  const otherChars = text.length - chineseChars;

  // Estimate: Chinese ~1.5 chars per token, others ~4 chars per token
  return Math.ceil(chineseChars / 1.5 + otherChars / 4);
}

/**
 * Record token usage for an API call
 */
export function recordUsage(params: {
  service: string;
  model?: string;
  inputText?: string;
  outputText?: string;
  inputTokens?: number;
  outputTokens?: number;
}): void {
  const inputTokens =
    params.inputTokens ?? estimateTokens(params.inputText || "");
  const outputTokens =
    params.outputTokens ?? estimateTokens(params.outputText || "");
  const totalTokens = inputTokens + outputTokens;

  const usage: TokenUsage = {
    timestamp: Date.now(),
    service: params.service,
    model: params.model,
    inputTokens,
    outputTokens,
    totalTokens,
  };

  usageHistory.push(usage);

  // Keep only last 1000 records to prevent memory issues
  if (usageHistory.length > 1000) {
    usageHistory = usageHistory.slice(-1000);
  }
}

/**
 * Get usage statistics
 */
export function getUsageStats(): UsageStats {
  const totalTokens = usageHistory.reduce(
    (sum, usage) => sum + usage.totalTokens,
    0
  );
  const totalInputTokens = usageHistory.reduce(
    (sum, usage) => sum + usage.inputTokens,
    0
  );
  const totalOutputTokens = usageHistory.reduce(
    (sum, usage) => sum + usage.outputTokens,
    0
  );

  const serviceBreakdown: Record<string, number> = {};
  const modelBreakdown: Record<string, number> = {};

  for (const usage of usageHistory) {
    serviceBreakdown[usage.service] =
      (serviceBreakdown[usage.service] || 0) + usage.totalTokens;
    if (usage.model) {
      modelBreakdown[usage.model] =
        (modelBreakdown[usage.model] || 0) + usage.totalTokens;
    }
  }

  return {
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    serviceBreakdown,
    modelBreakdown,
    requestCount: usageHistory.length,
    usageHistory: [...usageHistory].reverse(), // Most recent first
  };
}
