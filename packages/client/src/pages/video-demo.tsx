import { Button } from "@base-ui/react/button";
import { useState, useRef } from "react";
import { Link } from "react-router";
import { api } from "../api/client";

export const VideoDemo = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [currentTaskId, setCurrentTaskId] = useState<string>("");
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const handleCreateVideoTask = async () => {
    setLoading(true);
    setResult("");
    setVideoUrl("");
    setStatus("");
    setCurrentTaskId("");
    isCancelledRef.current = false;

    // 清除之前的轮询
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    try {
      // 创建视频生成任务
      const { data, error } = await api.llm.video.create.post({
        model: "doubao-seedance-1-0-pro-250528", // 使用示例模型ID
        content: [
          {
            type: "text",
            text: "女孩抱着狐狸，女孩睁开眼，温柔地看向镜头，狐狸友善地抱着，镜头缓缓拉出，女孩的头发被风吹动 --ratio adaptive --dur 5",
          },
        ],
        return_last_frame: false,
      });

      if (error) {
        setResult(`Error: ${JSON.stringify(error, null, 2)}`);
        setLoading(false);
        return;
      }

      const newTaskId = data?.id || "";
      setCurrentTaskId(newTaskId);
      setResult(`任务创建成功！任务ID: ${newTaskId}\n正在查询任务状态...`);

      // 开始轮询查询任务状态
      await pollTaskStatus(newTaskId);
    } catch (err) {
      setResult(`Exception: ${err}`);
      setLoading(false);
    }
  };

  const pollTaskStatus = async (id: string) => {
    const maxAttempts = 60; // 最多查询60次
    const pollInterval = 5000; // 每5秒查询一次
    let attempts = 0;

    const poll = async () => {
      // 检查是否已取消
      if (isCancelledRef.current) {
        setLoading(false);
        return;
      }

      if (attempts >= maxAttempts) {
        setResult(
          (prev) =>
            `${prev}\n\n查询超时：已查询${maxAttempts}次，请稍后手动查询任务状态。`
        );
        setLoading(false);
        return;
      }

      attempts++;

      try {
        const { data, error } = await api.llm.video.task({ taskId: id }).get();

        // 再次检查是否已取消
        if (isCancelledRef.current) {
          setLoading(false);
          return;
        }

        if (error) {
          setResult(
            (prev) =>
              `${prev}\n查询错误 (第${attempts}次): ${JSON.stringify(
                error,
                null,
                2
              )}`
          );
          setLoading(false);
          return;
        }

        const currentStatus = data?.status || "unknown";
        setStatus(currentStatus);
        setResult(
          (prev) =>
            `${prev}\n[${new Date().toLocaleTimeString()}] 任务状态: ${currentStatus}`
        );

        if (currentStatus === "succeeded") {
          const url = data?.content?.video_url;
          if (url) {
            setVideoUrl(url);
            setResult(
              (prev) => `${prev}\n\n✅ 视频生成成功！\n视频地址: ${url}`
            );
          } else {
            setResult((prev) => `${prev}\n\n✅ 任务完成，但未获取到视频地址。`);
          }
          setLoading(false);
          pollTimeoutRef.current = null;
          return;
        }

        if (currentStatus === "failed") {
          const errorMsg = data?.error
            ? `错误: ${data.error.code} - ${data.error.message}`
            : "任务失败";
          setResult((prev) => `${prev}\n\n❌ ${errorMsg}`);
          setLoading(false);
          pollTimeoutRef.current = null;
          return;
        }

        // 如果任务还在进行中，继续轮询
        if (
          currentStatus === "queued" ||
          currentStatus === "running" ||
          currentStatus === "processing"
        ) {
          pollTimeoutRef.current = setTimeout(poll, pollInterval);
        } else {
          setResult(
            (prev) => `${prev}\n\n任务状态: ${currentStatus}，停止轮询。`
          );
          setLoading(false);
          pollTimeoutRef.current = null;
        }
      } catch (err) {
        // 检查是否已取消
        if (isCancelledRef.current) {
          setLoading(false);
          return;
        }
        setResult((prev) => `${prev}\n查询异常 (第${attempts}次): ${err}`);
        // 继续尝试
        pollTimeoutRef.current = setTimeout(poll, pollInterval);
      }
    };

    // 开始第一次查询
    pollTimeoutRef.current = setTimeout(poll, pollInterval);
  };

  // 取消任务（仅适用于 queued 状态）
  const handleCancelTask = async () => {
    if (!currentTaskId) {
      setResult((prev) => `${prev}\n\n❌ 没有正在进行的任务可以取消。`);
      return;
    }

    // 检查任务状态，只有 queued 状态才能取消
    if (status !== "queued") {
      setResult(
        (prev) =>
          `${prev}\n\n⚠️ 任务状态为 ${status}，无法取消。只有排队中的任务可以取消。`
      );
      return;
    }

    try {
      setResult((prev) => `${prev}\n\n正在取消任务...`);

      // 调用后端 API 取消任务
      const { data, error } = await api.llm.video
        .task({ taskId: currentTaskId })
        .delete();

      // 如果 API 调用失败（网络错误等），停止轮询并显示错误
      if (error) {
        isCancelledRef.current = true;
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        setResult(
          (prev) =>
            `${prev}\n\n❌ 取消任务失败: ${JSON.stringify(error, null, 2)}`
        );
        setStatus("monitoring_stopped");
        setLoading(false);
        setCurrentTaskId("");
        return;
      }

      // API 调用成功
      if (data?.success) {
        // 取消成功，停止轮询
        isCancelledRef.current = true;
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        setResult(
          (prev) => `${prev}\n\n✅ 任务已取消: ${data?.message || "取消成功"}`
        );
        setStatus("cancelled");
        setLoading(false);
        setCurrentTaskId("");
      } else {
        // 后端返回 success: false
        isCancelledRef.current = true;
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }
        setResult(
          (prev) =>
            `${prev}\n\n⚠️ ${data?.message || "取消失败"}\n已停止监控此任务。`
        );
        setStatus("monitoring_stopped");
        setLoading(false);
        setCurrentTaskId("");
      }
    } catch (err) {
      // 发生异常，停止轮询
      isCancelledRef.current = true;
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      setResult(
        (prev) => `${prev}\n\n❌ 取消任务时发生异常: ${err}\n已停止监控此任务。`
      );
      setStatus("monitoring_stopped");
      setLoading(false);
      setCurrentTaskId("");
    }
  };

  // 删除记录（清除本地状态，不调用 API）
  const handleDeleteRecord = () => {
    setResult("");
    setVideoUrl("");
    setStatus("");
    setCurrentTaskId("");
    setLoading(false);

    // 清除轮询
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    isCancelledRef.current = false;
  };

  const buttonClass =
    "flex items-center justify-center h-10 px-3.5 m-1 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Link
        to="/"
        className="mb-4 text-blue-600 hover:text-blue-800 underline"
      >
        ← 返回首页
      </Link>
      <h1 className="text-2xl font-bold mb-6">视频生成 API Demo</h1>
      <p className="text-gray-600 mb-4">
        点击按钮创建视频生成任务，系统将自动轮询任务状态
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          className={buttonClass}
          onClick={handleCreateVideoTask}
          disabled={loading}
        >
          {loading ? "生成中..." : "生成视频"}
        </Button>
        {/* 只有 queued 状态才显示取消任务按钮 */}
        {loading && currentTaskId && status === "queued" && (
          <Button
            className={buttonClass
              .replace("bg-gray-50", "bg-red-50")
              .replace("hover:bg-gray-100", "hover:bg-red-100")
              .replace("active:bg-gray-200", "active:bg-red-200")
              .replace("text-gray-900", "text-red-900")}
            onClick={handleCancelTask}
          >
            取消任务
          </Button>
        )}
        {/* 任务已完成或失败时显示删除记录按钮 */}
        {!loading &&
          currentTaskId &&
          (status === "succeeded" ||
            status === "failed" ||
            status === "cancelled") && (
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

      {videoUrl && (
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-2">生成的视频:</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            <video
              src={videoUrl}
              controls
              className="w-full rounded-md"
              style={{ maxHeight: "500px" }}
            >
              <track kind="captions" />
              您的浏览器不支持视频播放。
            </video>
            <div className="mt-2">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {videoUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

