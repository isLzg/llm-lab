import { Elysia } from "elysia";
import { LLMService } from "./service";
import { LLMModel } from "./model";

// Unified LLM module with both Gemini and DeepSeek routes
export const llm = new Elysia({ prefix: "/llm" })
  // Gemini route
  .post(
    "/gemini/generate",
    ({ body }) => {
      return LLMService.generateContentWithGemini(body);
    },
    {
      body: LLMModel.generateContentBody,
    }
  )
  // DeepSeek route
  .post(
    "/deepseek/generate",
    ({ body }) => {
      return LLMService.generateContentWithDeepSeek(body);
    },
    {
      body: LLMModel.generateContentBody,
    }
  );
