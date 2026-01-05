import { t } from "elysia";

// Unified model for LLM API requests and responses
export const LLMModel = {
  // POST body for generate content
  generateContentBody: t.Object({
    contents: t.String(),
    model: t.Optional(t.String()),
  }),

  // Response type
  generateContentResponse: t.Object({
    text: t.String(),
  }),

  // Video generation models
  // POST body for create video generation task
  createVideoTaskBody: t.Object({
    model: t.String(),
    content: t.Array(
      t.Union([
        t.Object({
          type: t.Literal("text"),
          text: t.String(),
        }),
        t.Object({
          type: t.Literal("image_url"),
          image_url: t.Object({
            url: t.String(),
          }),
        }),
      ])
    ),
    callback_url: t.Optional(t.String()),
    return_last_frame: t.Optional(t.Boolean()),
  }),

  // Response type for create task
  createVideoTaskResponse: t.Object({
    id: t.String(),
  }),

  // Query task params (Elysia route params)
  queryVideoTaskParams: t.Object(
    {
      taskId: t.String(),
    },
    {
      description: "Task ID parameter",
    }
  ),

  // Query task response
  queryVideoTaskResponse: t.Object({
    id: t.String(),
    status: t.String(),
    content: t.Optional(
      t.Object({
        video_url: t.Optional(t.String()),
        last_frame_url: t.Optional(t.String()),
      })
    ),
    error: t.Optional(
      t.Object({
        code: t.String(),
        message: t.String(),
      })
    ),
  }),

  // Cancel task params
  cancelVideoTaskParams: t.Object(
    {
      taskId: t.String(),
    },
    {
      description: "Task ID parameter for cancellation",
    }
  ),

  // Cancel task response
  cancelVideoTaskResponse: t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
  }),

  // Image generation models
  // POST body for create image generation task
  createImageTaskBody: t.Object({
    model: t.String(),
    prompt: t.String(),
    negative_prompt: t.Optional(t.String()),
    width: t.Optional(t.Number()),
    height: t.Optional(t.Number()),
    steps: t.Optional(t.Number()),
    seed: t.Optional(t.Number()),
    guidance_scale: t.Optional(t.Number()),
    num_images: t.Optional(t.Number()),
  }),

  // Mastra Agent models
  // POST body for Mastra Agent chat
  mastraAgentChatBody: t.Object({
    messages: t.Array(
      t.Object({
        role: t.Union([
          t.Literal("user"),
          t.Literal("assistant"),
          t.Literal("system"),
        ]),
        content: t.String(),
      })
    ),
  }),
};
