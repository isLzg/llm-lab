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
};

