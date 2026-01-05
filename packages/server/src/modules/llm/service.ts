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

  // Cancel video generation task
  async cancelVideoTask(
    taskId: string
  ): Promise<typeof LLMModel.cancelVideoTaskResponse.static> {
    console.log("🎬 Cancel Video Task ~ taskId:", taskId);

    try {
      // 先查询任务状态
      const taskStatus = await this.queryVideoTask(taskId);
      const status = taskStatus.status;

      // 如果任务已经完成或失败，不需要删除
      if (status === "succeeded" || status === "failed") {
        return {
          success: false,
          message: `任务已经${
            status === "succeeded" ? "完成" : "失败"
          }，无需取消。`,
        };
      }

      // 如果任务正在运行，根据 API 限制无法删除
      if (status === "running" || status === "processing") {
        return {
          success: false,
          message: "任务正在运行中，火山引擎 API 不允许删除正在运行的任务。",
        };
      }

      // 如果任务处于 queued 状态，可以尝试删除
      if (status === "queued") {
        const response = await fetch(
          `${
            process.env.VOLCENGINE_API_BASE ||
            "https://ark.cn-beijing.volces.com/api/v3"
          }/contents/generations/tasks/${taskId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${process.env.VOLCENGINE_API_KEY || ""}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({
            error: `HTTP ${response.status}: ${response.statusText}`,
          }))) as {
            error?: {
              code?: string;
              message?: string;
            };
            ResponseMetadata?: {
              Error?: {
                Code?: string;
                Message?: string;
              };
            };
          };

          // 检查是否是"任务正在运行无法删除"的错误（可能在查询和删除之间状态改变了）
          const errorCode =
            errorData?.error?.code || errorData?.ResponseMetadata?.Error?.Code;
          const errorMessage =
            errorData?.error?.message ||
            errorData?.ResponseMetadata?.Error?.Message ||
            "";

          if (
            errorCode === "InvalidAction.RunningTaskDeletion" ||
            errorMessage.includes("currently running")
          ) {
            return {
              success: false,
              message: "任务状态已变为运行中，无法删除。",
            };
          }

          // 其他错误
          console.error("❌ Video Cancel API error:", errorData);
          throw new Error(
            `Video Cancel API error: ${JSON.stringify(errorData)}`
          );
        }

        // DELETE 请求返回空响应 {}，这是正常的
        console.log("🎬 Cancel Video Task ~ response: {} (success)");

        return {
          success: true,
          message: "任务已取消",
        };
      }

      // 其他未知状态
      return {
        success: false,
        message: `任务状态为 ${status}，无法确定是否可以取消。`,
      };
    } catch (error) {
      console.error("❌ Video Cancel API error:", error);
      throw error;
    }
  },
};
