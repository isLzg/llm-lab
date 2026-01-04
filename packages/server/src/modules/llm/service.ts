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
};
