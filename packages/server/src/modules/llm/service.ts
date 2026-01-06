import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { LLMModel } from "./model";
import * as UsageService from "../usage/service";

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

      // Record token usage
      UsageService.recordUsage({
        service: "gemini",
        model: body.model || "gemini-2.5-flash",
        inputText: body.contents,
        outputText: text,
      });

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

    let accumulatedOutput = "";

    try {
      const stream = await deepseek.chat.completions.create({
        messages: [{ role: "user", content: body.contents }],
        model: body.model || "deepseek-chat",
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          accumulatedOutput += content;
          yield content;
        }
      }

      // Record token usage after stream completes
      UsageService.recordUsage({
        service: "deepseek",
        model: body.model || "deepseek-chat",
        inputText: body.contents,
        outputText: accumulatedOutput,
      });
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

  // Volcengine Image generation API
  async *createImageTaskStream(
    body: typeof LLMModel.createImageTaskBody.static
  ): AsyncGenerator<
    | { type: "status"; status: string; taskId?: string }
    | { type: "image"; imageUrl: string }
    | { type: "error"; error: string }
    | { type: "done" },
    void,
    unknown
  > {
    console.log("🖼️ Create Image Task Stream ~ body:", body);

    try {
      const apiBase =
        process.env.VOLCENGINE_API_BASE ||
        "https://ark.cn-beijing.volces.com/api/v3";
      const apiKey = process.env.VOLCENGINE_API_KEY;

      // 创建图片生成任务
      const response = await fetch(`${apiBase}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...body,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("❌ Image API error:", errorData);
        yield { type: "error", error: JSON.stringify(errorData) };
        return;
      }

      // 处理流式响应
      if (!response.body) {
        yield { type: "error", error: "Response body is null" };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 保留最后一个不完整的行

          for (const line of lines) {
            if (line.trim() === "") continue;

            // 处理 SSE 格式的数据
            if (line.startsWith("data: ")) {
              const data = line.slice(6); // 移除 "data: " 前缀

              if (data === "[DONE]") {
                yield { type: "done" };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                console.log(
                  "🖼️ Parsed SSE data:",
                  JSON.stringify(parsed, null, 2)
                );

                // 发送任务 ID
                if (parsed.id) {
                  yield {
                    type: "status",
                    status: "created",
                    taskId: parsed.id,
                  };
                }

                // 发送状态更新
                if (parsed.status) {
                  yield {
                    type: "status",
                    status: parsed.status,
                    taskId: parsed.id,
                  };
                }

                // 发送图片 URL
                if (parsed.content) {
                  if (parsed.content.image_url) {
                    console.log(
                      "🖼️ Found image_url:",
                      parsed.content.image_url
                    );
                    yield {
                      type: "image",
                      imageUrl: parsed.content.image_url,
                    };
                  }
                  if (
                    parsed.content.image_urls &&
                    Array.isArray(parsed.content.image_urls)
                  ) {
                    console.log(
                      "🖼️ Found image_urls:",
                      parsed.content.image_urls
                    );
                    for (const url of parsed.content.image_urls) {
                      yield { type: "image", imageUrl: url };
                    }
                  }
                }

                // 检查是否有直接的图片URL字段（某些API可能直接返回）
                if (parsed.url && typeof parsed.url === "string") {
                  console.log("🖼️ Found direct url:", parsed.url);
                  yield {
                    type: "image",
                    imageUrl: parsed.url,
                  };
                }
                if (parsed.data && Array.isArray(parsed.data)) {
                  console.log("🖼️ Found data array:", parsed.data);
                  for (const item of parsed.data) {
                    if (item.url) {
                      yield { type: "image", imageUrl: item.url };
                    }
                  }
                }

                // 发送错误
                if (parsed.error) {
                  yield {
                    type: "error",
                    error: `${parsed.error.code || "Error"}: ${
                      parsed.error.message || "Unknown error"
                    }`,
                  };
                }
              } catch (parseError) {
                console.error("❌ Failed to parse SSE data:", parseError);
                console.error("❌ Raw data:", data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      yield { type: "done" };
    } catch (error) {
      console.error("❌ Image Stream API error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      yield { type: "error", error: errorMessage };
    }
  },

  // Volcengine Image-to-Image generation API
  async *createImageToImageTaskStream(
    body: typeof LLMModel.createImageToImageTaskBody.static
  ): AsyncGenerator<
    | { type: "status"; status: string; taskId?: string }
    | { type: "image"; imageUrl: string }
    | { type: "error"; error: string }
    | { type: "done" },
    void,
    unknown
  > {
    console.log("🖼️ Create Image-to-Image Task Stream ~ body:", body);

    try {
      const apiBase =
        process.env.VOLCENGINE_API_BASE ||
        "https://ark.cn-beijing.volces.com/api/v3";
      const apiKey = process.env.VOLCENGINE_API_KEY;

      // 创建图片生成任务（以图生图）
      const response = await fetch(`${apiBase}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ...body,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("❌ Image-to-Image API error:", errorData);
        yield { type: "error", error: JSON.stringify(errorData) };
        return;
      }

      // 处理流式响应
      if (!response.body) {
        yield { type: "error", error: "Response body is null" };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // 保留最后一个不完整的行

          for (const line of lines) {
            if (line.trim() === "") continue;

            // 处理 SSE 格式的数据
            if (line.startsWith("data: ")) {
              const data = line.slice(6); // 移除 "data: " 前缀

              if (data === "[DONE]") {
                yield { type: "done" };
                return;
              }

              try {
                const parsed = JSON.parse(data);
                console.log(
                  "🖼️ Parsed SSE data (Image-to-Image):",
                  JSON.stringify(parsed, null, 2)
                );

                // 发送任务 ID
                if (parsed.id) {
                  yield {
                    type: "status",
                    status: "created",
                    taskId: parsed.id,
                  };
                }

                // 发送状态更新
                if (parsed.status) {
                  yield {
                    type: "status",
                    status: parsed.status,
                    taskId: parsed.id,
                  };
                }

                // 发送图片 URL
                if (parsed.content) {
                  if (parsed.content.image_url) {
                    console.log(
                      "🖼️ Found image_url:",
                      parsed.content.image_url
                    );
                    yield {
                      type: "image",
                      imageUrl: parsed.content.image_url,
                    };
                  }
                  if (
                    parsed.content.image_urls &&
                    Array.isArray(parsed.content.image_urls)
                  ) {
                    console.log(
                      "🖼️ Found image_urls:",
                      parsed.content.image_urls
                    );
                    for (const url of parsed.content.image_urls) {
                      yield { type: "image", imageUrl: url };
                    }
                  }
                }

                // 检查是否有直接的图片URL字段（某些API可能直接返回）
                if (parsed.url && typeof parsed.url === "string") {
                  console.log("🖼️ Found direct url:", parsed.url);
                  yield {
                    type: "image",
                    imageUrl: parsed.url,
                  };
                }
                if (parsed.data && Array.isArray(parsed.data)) {
                  console.log("🖼️ Found data array:", parsed.data);
                  for (const item of parsed.data) {
                    if (item.url) {
                      yield { type: "image", imageUrl: item.url };
                    }
                  }
                }

                // 发送错误
                if (parsed.error) {
                  yield {
                    type: "error",
                    error: `${parsed.error.code || "Error"}: ${
                      parsed.error.message || "Unknown error"
                    }`,
                  };
                }
              } catch (parseError) {
                console.error("❌ Failed to parse SSE data:", parseError);
                console.error("❌ Raw data:", data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      yield { type: "done" };
    } catch (error) {
      console.error("❌ Image-to-Image Stream API error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      yield { type: "error", error: errorMessage };
    }
  },

  // Query image generation task status (fallback for getting image URLs)
  async queryImageTask(taskId: string): Promise<{
    id: string;
    status: string;
    content?: {
      image_url?: string;
      image_urls?: string[];
    };
    error?: {
      code: string;
      message: string;
    };
  }> {
    console.log("🖼️ Query Image Task ~ taskId:", taskId);

    try {
      const response = await fetch(
        `${process.env.VOLCENGINE_BASE_URL}/images/generations/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.VOLCENGINE_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        console.error("❌ Image Query API error:", errorData);
        throw new Error(`Image Query API error: ${JSON.stringify(errorData)}`);
      }

      const data = (await response.json()) as {
        id?: string;
        status?: string;
        content?: {
          image_url?: string;
          image_urls?: string[];
        };
        error?: {
          code?: string;
          message?: string;
        };
      };
      console.log("🖼️ Query Image Task ~ response:", data);

      return {
        id: data.id || taskId,
        status: data.status || "unknown",
        content: data.content
          ? {
              image_url: data.content.image_url,
              image_urls: data.content.image_urls,
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
      console.error("❌ Image Query API error:", error);
      throw error;
    }
  },

  // Mastra Agent API
  /**
   * 发送消息给 Mastra Weather Agent
   */
  async *streamWithMastraAgent(
    body: typeof LLMModel.mastraAgentChatBody.static
  ): AsyncGenerator<string, void, unknown> {
    const mastraApiBaseUrl =
      process.env.MASTRA_API_BASE_URL || "http://localhost:4111";
    const url = `${mastraApiBaseUrl}/api/agents/weatherAgent/stream`;

    try {
      // 添加超时处理（30秒）
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout after 30 seconds"));
        }, 30000);
      });

      const fetchPromise = fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: body.messages }),
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP error! status: ${response.status}`,
        }));
        const errorMessage =
          (errorData as { error?: string })?.error ||
          `HTTP error! status: ${response.status}`;
        console.error("❌ Mastra Agent Stream API error:", errorMessage);
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let buffer = "";
      let yieldCount = 0;
      let accumulatedOutput = "";
      const inputText = body.messages.map((m) => m.content).join("\n");

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const decoded = decoder.decode(value, { stream: true });
        buffer += decoded;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim() === "") continue;

          if (line.startsWith("data: ")) {
            const dataContent = line.slice(6).trim();

            // 处理 [DONE] 标记
            if (dataContent === "[DONE]") {
              continue;
            }

            try {
              const data = JSON.parse(dataContent);

              let textToYield: string | null = null;

              // 优先处理流式事件（text-delta, text-end）
              if (data.type === "text-delta" || data.type === "text-end") {
                // 流式文本增量事件
                if (data.content && typeof data.content === "string") {
                  textToYield = data.content;
                } else if (data.text && typeof data.text === "string") {
                  textToYield = data.text;
                } else if (data.delta && typeof data.delta === "string") {
                  textToYield = data.delta;
                } else if (
                  data.payload?.content &&
                  typeof data.payload.content === "string"
                ) {
                  textToYield = data.payload.content;
                } else if (
                  data.payload?.text &&
                  typeof data.payload.text === "string"
                ) {
                  textToYield = data.payload.text;
                }
              }
              // finish 事件：如果只有 finish 事件（没有流式事件），将完整文本分块发送以保持流式效果
              else if (data.type === "finish" && data.payload?.output?.text) {
                const fullText = data.payload.output.text;
                // 如果这是第一个 yield（说明之前没有流式事件），将完整文本分块发送
                if (yieldCount === 0) {
                  // 将文本分成小块，模拟流式效果
                  const chunkSize = 10; // 每次发送10个字符
                  for (let i = 0; i < fullText.length; i += chunkSize) {
                    const chunk = fullText.slice(i, i + chunkSize);
                    yield chunk;
                    yieldCount++;
                    // 添加小延迟以模拟流式效果（可选）
                    await new Promise((resolve) => setTimeout(resolve, 10));
                  }
                  return; // 已经 yield 完成，不需要继续处理
                }
              }
              // 跳过所有其他事件类型（tool-call, tool-result, step-finish, text-start 等）

              // 只 yield 实际文本内容
              if (textToYield && textToYield.length > 0) {
                yieldCount++;
                accumulatedOutput += textToYield;
                yield textToYield;
              }
            } catch (e) {
              console.error(
                "❌ 解析 Mastra 数据失败:",
                e,
                "原始数据:",
                dataContent.substring(0, 200)
              );
            }
          }
        }
      }

      // Record token usage after stream completes
      UsageService.recordUsage({
        service: "mastra",
        model: "weatherAgent",
        inputText,
        outputText: accumulatedOutput,
      });
    } catch (error) {
      console.error("❌ Mastra Agent Stream API error:", error);
      throw error instanceof Error
        ? error
        : new Error("Unknown error occurred");
    }
  },
};
