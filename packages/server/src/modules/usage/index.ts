import { Elysia } from "elysia";
import * as UsageService from "./service";
import { UsageModel } from "./model";

export const usage = new Elysia({ prefix: "/usage" }).get(
  "/stats",
  () => {
    return UsageService.getUsageStats();
  },
  {
    response: UsageModel.usageStatsResponse,
  }
);
