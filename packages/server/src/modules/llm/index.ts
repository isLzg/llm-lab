import { Elysia, t } from "elysia";
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
  )
  .delete(
    "/video/task/:taskId",
    ({ params }) => {
      return LLMService.cancelVideoTask(params.taskId);
    },
    {
      params: LLMModel.cancelVideoTaskParams,
    }
  )
  // Volcengine Image generation routes (streaming)
  .post(
    "/image/create",
    async ({ body }) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of LLMService.createImageTaskStream(body)) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: errorMessage,
                })}\n\n`
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
      body: LLMModel.createImageTaskBody,
    }
  )
  .get(
    "/image/task/:taskId",
    ({ params }) => {
      return LLMService.queryImageTask(params.taskId);
    },
    {
      params: t.Object({
        taskId: t.String(),
      }),
    }
  )
  // Volcengine Image-to-Image generation routes
  .post(
    "/image/image-to-image/create",
    async ({ body }) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of LLMService.createImageToImageTaskStream(
              body
            )) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
              );
            }
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "error",
                  error: errorMessage,
                })}\n\n`
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
      body: LLMModel.createImageToImageTaskBody,
    }
  )
  // Mastra Agent routes
  .post(
    "/mastra/stream",
    async ({ body }) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of LLMService.streamWithMastraAgent(body)) {
              const encoded = encoder.encode(
                `data: ${JSON.stringify({ chunk })}\n\n`
              );
              controller.enqueue(encoded);
            }
            controller.close();
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error("❌ Route ~ Stream error:", errorMessage);
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
      body: LLMModel.mastraAgentChatBody,
    }
  );
