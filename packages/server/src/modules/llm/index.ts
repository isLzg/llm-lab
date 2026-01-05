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
    async ({ body }) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of LLMService.generateContentWithDeepSeekStream(
              body
            )) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
              );
            }
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: errorMessage })}\n\n`
              )
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
    {
      body: LLMModel.generateContentBody,
    }
  )
  // Volcengine Video generation routes
  .post(
    "/video/create",
    ({ body }) => {
      return LLMService.createVideoTask(body);
    },
    {
      body: LLMModel.createVideoTaskBody,
    }
  )
  .get(
    "/video/task/:taskId",
    ({ params }) => {
      return LLMService.queryVideoTask(params.taskId);
    },
    {
      params: LLMModel.queryVideoTaskParams,
    }
  );
