import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { LLMModel } from "./model";

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const LLMService = {
  // Gemini API
  async generateContentWithGemini(
    body: typeof LLMModel.generateContentBody.static
  ): Promise<typeof LLMModel.generateContentResponse.static> {
    console.log("🤖 Gemini ~ body:", body);

    try {
      const response = await gemini.models.generateContent({
        model: body.model || "gemini-2.5-flash",
        contents: body.contents,
      });

      const text = response.text || "";
      console.log("🤖 Gemini ~ response:", text);

      return {
        text,
      };
    } catch (error) {
      console.error("❌ Gemini API error:", error);
      throw error;
    }
  },

  // DeepSeek API with streaming
  async *generateContentWithDeepSeekStream(
    body: typeof LLMModel.generateContentBody.static
  ): AsyncGenerator<string, void, unknown> {
    console.log("🤖 DeepSeek Stream ~ body:", body);

    try {
      const stream = await deepseek.chat.completions.create({
        messages: [{ role: "user", content: body.contents }],
        model: body.model || "deepseek-chat",
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error("❌ DeepSeek Stream API error:", error);
      throw error;
    }
  },

  // Video generation API (Volcengine)
  async createVideoTask(
    body: typeof LLMModel.createVideoTaskBody.static
  ): Promise<typeof LLMModel.createVideoTaskResponse.static> {
    console.log("🎬 Create Video Task ~ body:", body);

    try {
      const response = await fetch(
        `${
          process.env.VOLCENGINE_API_BASE ||
          "https://ark.cn-beijing.volces.com/api/v3"
        }/contents/generations/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.VOLCENGINE_API_KEY || ""}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("❌ Video API error:", errorData);
        throw new Error(`Video API error: ${JSON.stringify(errorData)}`);
      }

      const data = (await response.json()) as { id: string };
      console.log("🎬 Create Video Task ~ response:", data);

      return {
        id: data.id,
      };
    } catch (error) {
      console.error("❌ Video API error:", error);
      throw error;
    }
  },

  // Query video generation task status
  async queryVideoTask(
    taskId: string
  ): Promise<typeof LLMModel.queryVideoTaskResponse.static> {
    console.log("🎬 Query Video Task ~ taskId:", taskId);

    try {
      const response = await fetch(
        `${
          process.env.VOLCENGINE_API_BASE ||
          "https://ark.cn-beijing.volces.com/api/v3"
        }/contents/generations/tasks/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.VOLCENGINE_API_KEY || ""}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("❌ Video Query API error:", errorData);
        throw new Error(`Video Query API error: ${JSON.stringify(errorData)}`);
      }

      const data = (await response.json()) as {
        id?: string;
        status?: string;
        content?: {
          video_url?: string;
          last_frame_url?: string;
        };
        error?: {
          code?: string;
          message?: string;
        };
      };
      console.log("🎬 Query Video Task ~ response:", data);

      return {
        id: data.id || taskId,
        status: data.status || "unknown",
        content: data.content
          ? {
              video_url: data.content.video_url,
              last_frame_url: data.content.last_frame_url,
            }
          : undefined,
        error: data.error
          ? {
              code: data.error.code || "",
              message: data.error.message || "",
            }
          : undefined,
      };
    } catch (error) {
      console.error("❌ Video Query API error:", error);
      throw error;
    }
  },
};
