import { Button } from "@base-ui/react/button";
import { useState, useRef } from "react";
import { Link } from "react-router";

const PLACEHOLDER_TEXT =
  "根据图片设计一个原木奶油风的客厅，要有沙发、茶几和软装";

const PRESET_IMAGE_URL =
  "https://portal.volccdn.com/obj/volcfe/cloud-universal-doc/upload_c8210e1b716e9eac0ac00a421b14a427.png";

export const ImageToImageDemo = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  const scale = 0.5;
  const model = "doubao-seedream-4-0-250828";
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasReceivedImageRef = useRef<boolean>(false);

  const handleCreateImageTask = async () => {
    setLoading(true);
    setResult("");
    setImageUrls([]);
    setStatus("");
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
      const response = await fetch(
        "http://localhost:3000/llm/image/image-to-image/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            prompt: PLACEHOLDER_TEXT,
            image_urls: [PRESET_IMAGE_URL],
            scale: scale,
            width: 1024,
            height: 1024,
            steps: 30,
            num_images: 1,
          }),
          signal: abortController.signal,
        }
      );

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
                    setStatus("处理中...");
                  }
                  if (parsed.status) {
                    setStatus(parsed.status);
                  }
                } else if (parsed.type === "image" && parsed.imageUrl) {
                  const imageUrl = parsed.imageUrl;
                  hasReceivedImageRef.current = true;
                  setImageUrls((prev) => {
                    if (!prev.includes(imageUrl)) {
                      return [...prev, imageUrl];
                    }
                    return prev;
                  });
                  setStatus("生成完成");
                } else if (parsed.type === "error") {
                  setResult((prev) => `${prev}\n\n❌ 错误: ${parsed.error}`);
                  setLoading(false);
                  setStatus("生成失败");
                  return;
                } else if (parsed.type === "done") {
                  // 流式响应完成，如果没有收到图片URL，尝试查询任务状态
                  if (taskIdForQuery && !hasReceivedImageRef.current) {
                    setStatus("查询中...");
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
                            setStatus("生成完成");
                          } else {
                            setStatus("未找到图片");
                          }
                        }
                      }
                    } catch (queryError) {
                      console.error("Query task error:", queryError);
                      setStatus("查询失败");
                    }
                  } else {
                    setStatus("生成完成");
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
        setStatus("已取消");
      } else {
        setResult(`Exception: ${err}`);
        setStatus("生成失败");
      }
      setLoading(false);
    }
  };

  const buttonClass =
    "flex items-center justify-center h-10 px-6 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500";

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-block mb-6 text-blue-600 hover:text-blue-800 underline"
        >
          ← 返回首页
        </Link>

        <h1 className="text-3xl font-bold mb-2">以图生图 API Demo</h1>

        {/* 预设信息展示 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">参考图片</h2>
            <div className="w-64 h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
              <img
                src={PRESET_IMAGE_URL}
                alt="参考图片"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">提示文本</h2>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
              {PLACEHOLDER_TEXT}
            </p>
          </div>
          {/* 生成按钮 */}
          <div className="flex items-center gap-4">
            <Button
              className={buttonClass}
              onClick={handleCreateImageTask}
              disabled={loading}
            >
              {loading ? "生成中..." : "生成图片"}
            </Button>
            {status && <span className="text-sm text-gray-600">{status}</span>}
          </div>
        </div>

        {/* 输出区域 */}
        {imageUrls.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">输出图片</h2>
            <div className="flex gap-4 flex-wrap">
              {imageUrls.map((url, index) => (
                <div key={url} className="relative group">
                  <div className="w-64 h-64 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                    <img
                      src={url}
                      alt={`输出图片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity truncate"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <details className="cursor-pointer">
              <summary className="text-sm font-medium text-gray-700 mb-2">
                任务日志
              </summary>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs whitespace-pre-wrap max-h-64 mt-2">
                {result}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};
