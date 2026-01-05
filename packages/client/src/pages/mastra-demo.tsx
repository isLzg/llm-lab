import { Button } from "@base-ui/react/button";
import { useState } from "react";
import { Link } from "react-router";

export const MastraDemo = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState<string>("今天北京的天气怎么样？");
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string;
    }>
  >([]);

  const handleChat = async () => {
    if (!input.trim()) {
      return;
    }

    setLoading(true);
    setResult("");

    // 添加用户消息到历史记录
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: input.trim(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // 流式调用
      const fetchResponse = await fetch(
        "http://localhost:3000/llm/mastra/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
          }),
        }
      );

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse
          .json()
          .catch(() => ({ error: "Unknown error" }));
        setResult(`Error: ${JSON.stringify(errorData, null, 2)}`);
        return;
      }

      // 读取流式响应
      const reader = fetchResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setResult("Error: No response stream");
        return;
      }

      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        // 累积数据到 buffer
        const decodedChunk = decoder.decode(value, { stream: true });
        buffer += decodedChunk;
        const lines = buffer.split("\n");
        // 保留最后一个不完整的行
        buffer = lines.pop() || "";

        // 处理完整的行
        for (const line of lines) {
          if (line.trim() === "") continue;

          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                setResult(`Error: ${data.error}`);
                return;
              }
              if (data.chunk) {
                accumulatedText += data.chunk;
                setResult(accumulatedText);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

      // 处理剩余的 buffer（如果有）
      if (buffer.trim()) {
        if (buffer.startsWith("data: ")) {
          try {
            const data = JSON.parse(buffer.slice(6));
            if (data.chunk) {
              accumulatedText += data.chunk;
              setResult(accumulatedText);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      // 流式响应完成，添加助手回复到历史记录
      if (accumulatedText) {
        setMessages([
          ...newMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: accumulatedText,
          },
        ]);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setResult("");
    setInput("今天北京的天气怎么样？");
  };

  const buttonClass =
    "flex items-center justify-center h-10 px-3.5 m-1 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Link to="/" className="mb-4 text-blue-600 hover:text-blue-800 underline">
        ← 返回首页
      </Link>
      <h1 className="text-2xl font-bold mb-6">Mastra Agent Demo</h1>
      <p className="text-gray-600 mb-4">
        与 Mastra Weather Agent 对话，查询天气信息（流式响应）
      </p>

      {/* 输入框 */}
      <div className="w-full max-w-2xl mb-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleChat();
            }
          }}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          className={buttonClass}
          onClick={handleChat}
          disabled={loading || !input.trim()}
        >
          {loading ? "发送中..." : "发送消息"}
        </Button>
        <Button
          className={buttonClass}
          onClick={handleClear}
          disabled={loading}
        >
          清空对话
        </Button>
      </div>

      {/* 对话历史 */}
      {messages.length > 0 && (
        <div className="w-full max-w-2xl mb-6">
          <h2 className="text-lg font-semibold mb-2">对话历史:</h2>
          <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-2 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span className="text-xs text-gray-500 mr-2">
                  {msg.role === "user" ? "用户" : "助手"}:
                </span>
                <span className="text-sm">{msg.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 当前响应 */}
      {result && (
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-2">当前响应:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-4 text-sm text-gray-500">
        <p>💡 提示: 按 Cmd/Ctrl + Enter 快速发送消息</p>
        <p className="mt-1">
          ⚠️ 确保 Mastra Agent 服务器运行在 http://localhost:4111
        </p>
      </div>
    </div>
  );
};
