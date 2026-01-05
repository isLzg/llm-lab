import { Button } from "@base-ui/react/button";
import { useState, useRef } from "react";

const PLACEHOLDER_TEXT = "例如：一只可爱的小猫坐在窗台上，阳光洒在它身上";

export const ImageDemo = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [currentTaskId, setCurrentTaskId] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [model, setModel] = useState<string>("doubao-seedream-4-0-250828"); // 默认模型名称，请根据实际开通的模型修改
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasReceivedImageRef = useRef<boolean>(false);

  const handleCreateImageTask = async () => {
    if (!prompt.trim()) {
      setResult("❌ 请输入图片描述");
      return;
    }

    setLoading(true);
    setResult("");
    setImageUrls([]);
    setStatus("");
    setCurrentTaskId("");
    hasReceivedImageRef.current = false;

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 调用流式 API
      const response = await fetch("http://localhost:3000/llm/image/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || "doubao-seedream-4-0-250828",
          prompt: prompt,
          width: 1024,
          height: 1024,
          steps: 30,
          num_images: 1,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        setResult(`Error: ${JSON.stringify(errorData, null, 2)}`);
        setLoading(false);
        return;
      }

      if (!response.body) {
        setResult("❌ Response body is null");
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let taskIdForQuery = ""; // 保存任务ID用于后续查询

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
                setLoading(false);
                setResult((prev) => `${prev}\n\n✅ 流式响应完成`);
                return;
              }

              try {
                const parsed = JSON.parse(data) as {
                  type: "status" | "image" | "error" | "done";
                  status?: string;
                  taskId?: string;
                  imageUrl?: string;
                  error?: string;
                };

                console.log("🖼️ Frontend received:", parsed);

                if (parsed.type === "status") {
                  if (parsed.taskId) {
                    taskIdForQuery = parsed.taskId;
                    setCurrentTaskId(parsed.taskId);
                    setResult(
                      (prev) =>
                        `${prev}\n任务创建成功！任务ID: ${parsed.taskId}`
                    );
                  }
                  if (parsed.status) {
                    setStatus(parsed.status);
                    setResult(
                      (prev) =>
                        `${prev}\n[${new Date().toLocaleTimeString()}] 任务状态: ${
                          parsed.status
                        }`
                    );
                  }
                } else if (parsed.type === "image" && parsed.imageUrl) {
                  const imageUrl = parsed.imageUrl;
                  hasReceivedImageRef.current = true;
                  setImageUrls((prev) => {
                    if (!prev.includes(imageUrl)) {
                      const newUrls = [...prev, imageUrl];
                      setResult(
                        (currentResult) =>
                          `${currentResult}\n\n✅ 收到图片: ${imageUrl}\n共生成 ${newUrls.length} 张图片`
                      );
                      return newUrls;
                    }
                    return prev;
                  });
                } else if (parsed.type === "error") {
                  setResult((prev) => `${prev}\n\n❌ 错误: ${parsed.error}`);
                  setLoading(false);
                  return;
                } else if (parsed.type === "done") {
                  // 流式响应完成，如果没有收到图片URL，尝试查询任务状态
                  if (taskIdForQuery && !hasReceivedImageRef.current) {
                    setResult(
                      (prev) =>
                        `${prev}\n\n✅ 流式响应完成，正在查询任务状态以获取图片...`
                    );
                    // 查询任务状态获取图片URL
                    try {
                      const queryResponse = await fetch(
                        `http://localhost:3000/llm/image/task/${taskIdForQuery}`
                      );
                      if (queryResponse.ok) {
                        const taskData = await queryResponse.json();
                        console.log("🖼️ Task query result:", taskData);
                        if (taskData.content) {
                          const urls: string[] = [];
                          if (taskData.content.image_url) {
                            urls.push(taskData.content.image_url);
                          }
                          if (taskData.content.image_urls) {
                            urls.push(...taskData.content.image_urls);
                          }
                          if (urls.length > 0) {
                            setImageUrls(urls);
                            setResult(
                              (prev) =>
                                `${prev}\n\n✅ 查询成功！共获取 ${urls.length} 张图片`
                            );
                          } else {
                            setResult(
                              (prev) =>
                                `${prev}\n\n⚠️ 任务状态: ${taskData.status}，但未找到图片URL`
                            );
                          }
                        }
                      }
                    } catch (queryError) {
                      console.error("Query task error:", queryError);
                      setResult(
                        (prev) =>
                          `${prev}\n\n⚠️ 查询任务状态失败: ${queryError}`
                      );
                    }
                  } else {
                    setResult((prev) => `${prev}\n\n✅ 流式响应完成`);
                  }
                  setLoading(false);
                  return;
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        setLoading(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setResult((prev) => `${prev}\n\n⚠️ 请求已取消`);
      } else {
        setResult(`Exception: ${err}`);
      }
      setLoading(false);
    }
  };

  // 删除记录（清除本地状态，不调用 API）
  const handleDeleteRecord = () => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setResult("");
    setImageUrls([]);
    setStatus("");
    setCurrentTaskId("");
    setLoading(false);
  };

  // 处理 Tab 键，填充 placeholder 内容
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !prompt.trim()) {
      e.preventDefault(); // 阻止默认的 Tab 行为（切换焦点）
      setPrompt(PLACEHOLDER_TEXT);
    }
  };

  const buttonClass =
    "flex items-center justify-center h-10 px-3.5 m-1 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">图片生成 API Demo</h1>
      <p className="text-gray-600 mb-4">
        输入图片描述，点击按钮创建图片生成任务，系统将通过流式响应实时更新状态
      </p>

      <div className="w-full max-w-2xl mb-6">
        <label
          htmlFor="model-input"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          模型名称 (Model):
        </label>
        <input
          id="model-input"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          placeholder="doubao-seedream-4-0-250828"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading}
        />
        <label
          htmlFor="prompt-textarea"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          图片描述 (Prompt):
        </label>
        <textarea
          id="prompt-textarea"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder={PLACEHOLDER_TEXT}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          className={buttonClass}
          onClick={handleCreateImageTask}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "生成中..." : "生成图片"}
        </Button>
        {/* 任务已完成或失败时显示删除记录按钮 */}
        {!loading &&
          currentTaskId &&
          (status === "succeeded" || status === "failed") && (
            <Button
              className={buttonClass
                .replace("bg-gray-50", "bg-gray-100")
                .replace("hover:bg-gray-100", "hover:bg-gray-200")
                .replace("active:bg-gray-200", "active:bg-gray-300")
                .replace("text-gray-900", "text-gray-700")}
              onClick={handleDeleteRecord}
            >
              删除记录
            </Button>
          )}
      </div>

      {status && (
        <div className="mb-4">
          <span className="text-blue-600 font-semibold">
            当前状态: {status}
          </span>
        </div>
      )}

      {result && (
        <div className="w-full max-w-2xl mb-6">
          <h2 className="text-lg font-semibold mb-2">任务日志:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap max-h-96">
            {result}
          </pre>
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-lg font-semibold mb-2">生成的图片:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imageUrls.map((url) => (
              <div key={url} className="bg-gray-100 p-4 rounded-md">
                <img
                  src={url}
                  alt={`Generated content from prompt: ${prompt.slice(
                    0,
                    30
                  )}...`}
                  className="w-full rounded-md mb-2"
                  style={{ maxHeight: "500px", objectFit: "contain" }}
                />
                <div className="mt-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all text-sm"
                  >
                    {url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
