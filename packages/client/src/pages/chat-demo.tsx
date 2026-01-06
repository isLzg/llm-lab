import { Button } from "@base-ui/react/button";
import { useState } from "react";
import { Link } from "react-router";
import { Streamdown } from "streamdown";

export const ChatDemo = () => {
  const [result, setResult] = useState<string>("");
  const [reasoning, setReasoning] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [apiType, setApiType] = useState<"gemini" | "deepseek">("gemini");
  const [thinkingMode, setThinkingMode] = useState(false);

  const handleGenerateContent = async () => {
    setLoading(true);
    setResult("");
    setReasoning("");
    try {
      const question = "Why is the sky blue?";

      if (apiType === "gemini") {
        // Use streaming for Gemini
        const fetchResponse = await fetch("http://localhost:3000/llm/gemini/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: question,
            model: "gemini-2.5-flash",
          }),
        });

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({ error: "Unknown error" }));
          setResult(`Error: ${JSON.stringify(errorData, null, 2)}`);
          return;
        }

        // Read stream
        const reader = fetchResponse.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";
        let buffer = "";

        if (!reader) {
          setResult("Error: No response stream");
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === "") continue;

              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.error) {
                    setResult(`Error: ${data.error}`);
                    return;
                  }
                  if (data.type === "content" && data.text) {
                    accumulatedText += data.text;
                    setResult(accumulatedText);
                  } else if (data.type === "done") {
                    // Final update with complete content
                    if (data.content) {
                      setResult(data.content);
                    }
                  } else if (data.text && !data.type) {
                    // Fallback
                    accumulatedText += data.text;
                    setResult(accumulatedText);
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                  console.error("Failed to parse SSE data:", e, "Line:", line);
                }
              }
            }
          }

          // Process remaining buffer if any
          if (buffer.trim()) {
            if (buffer.startsWith("data: ")) {
              try {
                const data = JSON.parse(buffer.slice(6));
                if (data.type === "content" && data.text) {
                  accumulatedText += data.text;
                  setResult(accumulatedText);
                } else if (data.type === "done" && data.content) {
                  setResult(data.content);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        return;
      }

      // DeepSeek streaming (no else needed since previous branch returns)
      {
        // Use streaming for DeepSeek
        const fetchResponse = await fetch("http://localhost:3000/llm/deepseek/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: question,
            model: "deepseek-chat",
            ...(thinkingMode && { thinking: { type: "enabled" } }),
          }),
        });

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({ error: "Unknown error" }));
          setResult(`Error: ${JSON.stringify(errorData, null, 2)}`);
          return;
        }

        // Read stream
        const reader = fetchResponse.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";
        let accumulatedReasoning = "";
        let buffer = "";

        if (!reader) {
          setResult("Error: No response stream");
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.trim() === "") continue;

              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.error) {
                    setResult(`Error: ${data.error}`);
                    return;
                  }
                  if (data.type === "reasoning" && data.text) {
                    accumulatedReasoning += data.text;
                    setReasoning(accumulatedReasoning);
                  } else if (data.type === "content" && data.text) {
                    accumulatedText += data.text;
                    setResult(accumulatedText);
                  } else if (data.type === "done") {
                    // Final update with complete content
                    if (data.reasoning) {
                      setReasoning(data.reasoning);
                    }
                    if (data.content) {
                      setResult(data.content);
                    }
                  } else if (data.text && !data.type) {
                    // Fallback for non-thinking mode
                    accumulatedText += data.text;
                    setResult(accumulatedText);
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                  console.error("Failed to parse SSE data:", e, "Line:", line);
                }
              }
            }
          }

          // Process remaining buffer if any
          if (buffer.trim()) {
            if (buffer.startsWith("data: ")) {
              try {
                const data = JSON.parse(buffer.slice(6));
                if (data.type === "reasoning" && data.text) {
                  accumulatedReasoning += data.text;
                  setReasoning(accumulatedReasoning);
                } else if (data.type === "content" && data.text) {
                  accumulatedText += data.text;
                  setResult(accumulatedText);
                } else if (data.type === "done") {
                  if (data.reasoning) {
                    setReasoning(data.reasoning);
                  }
                  if (data.content) {
                    setResult(data.content);
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        return;
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const buttonClass =
    "flex items-center justify-center h-10 px-3.5 m-1 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500";

  const activeButtonClass =
    "flex items-center justify-center h-10 px-3.5 m-1 outline-0 border border-blue-500 rounded-md bg-blue-50 font-inherit text-base font-medium leading-6 text-blue-900 select-none hover:bg-blue-100 active:bg-blue-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Link to="/" className="mb-4 text-blue-600 hover:text-blue-800 underline">
        ← 返回首页
      </Link>
      <h1 className="text-2xl font-bold mb-6">LLM API Demo</h1>
      <p className="text-gray-600 mb-4">选择 API 并点击按钮获取回答</p>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <Button
          className={apiType === "gemini" ? activeButtonClass : buttonClass}
          onClick={() => setApiType("gemini")}
          disabled={loading}
        >
          Gemini
        </Button>
        <Button
          className={apiType === "deepseek" ? activeButtonClass : buttonClass}
          onClick={() => setApiType("deepseek")}
          disabled={loading}
        >
          DeepSeek
        </Button>
      </div>

      {apiType === "deepseek" && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={thinkingMode}
              onChange={(e) => setThinkingMode(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">开启思考模式</span>
          </label>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button className={buttonClass} onClick={handleGenerateContent} disabled={loading}>
          {loading ? "Loading..." : `调用 ${apiType === "gemini" ? "Gemini" : "DeepSeek"} API`}
        </Button>
      </div>

      {(reasoning || result) && (
        <div className="w-full max-w-6xl space-y-6">
          {reasoning && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-purple-700">思维链 (Reasoning):</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 原始版本 - 不使用 Streamdown */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-600">
                    原始版本 (不使用 Streamdown)
                  </h3>
                  <pre className="bg-purple-50 border border-purple-200 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap h-64">
                    {reasoning}
                  </pre>
                </div>
                {/* 美化版本 - 使用 Streamdown */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-600">
                    美化版本 (使用 Streamdown)
                  </h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-md overflow-auto text-sm h-64 streamdown-container">
                    <Streamdown isAnimating={loading}>{reasoning}</Streamdown>
                  </div>
                </div>
              </div>
            </div>
          )}
          {result && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-blue-700">
                {apiType === "gemini" ? "Gemini" : "DeepSeek"} 最终回答 (Content):
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 原始版本 - 不使用 Streamdown */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-600">
                    原始版本 (不使用 Streamdown)
                  </h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap h-64">
                    {result}
                  </pre>
                </div>
                {/* 美化版本 - 使用 Streamdown */}
                <div>
                  <h3 className="text-sm font-medium mb-2 text-gray-600">
                    美化版本 (使用 Streamdown)
                  </h3>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto text-sm h-64 streamdown-container">
                    <Streamdown isAnimating={loading}>{result}</Streamdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
