import { t } from "elysia";

export const UsageModel = {
  // Response type for usage stats
  usageStatsResponse: t.Object({
    totalTokens: t.Number(),
    totalInputTokens: t.Number(),
    totalOutputTokens: t.Number(),
    serviceBreakdown: t.Record(t.String(), t.Number()),
    modelBreakdown: t.Record(t.String(), t.Number()),
    requestCount: t.Number(),
    usageHistory: t.Array(
      t.Object({
        timestamp: t.Number(),
        service: t.String(),
        model: t.Optional(t.String()),
        inputTokens: t.Number(),
        outputTokens: t.Number(),
        totalTokens: t.Number(),
      })
    ),
  }),
};

