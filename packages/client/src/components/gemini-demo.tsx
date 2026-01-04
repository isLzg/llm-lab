import { Button } from "@base-ui/react/button";
import { useState } from "react";
import { api } from "../api/client";

export const GeminiDemo = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [apiType, setApiType] = useState<"gemini" | "deepseek">("gemini");

  const handleGenerateContent = async () => {
    setLoading(true);
    setResult("");
    try {
      const question = "Why is the sky blue?";
      let response: string;

      if (apiType === "gemini") {
        const { data, error } = await api.llm.gemini.generate.post({
          contents: question,
          model: "gemini-2.5-flash",
        });
        if (error) {
          setResult(`Error: ${JSON.stringify(error, null, 2)}`);
          return;
        }
        response = data?.text || "No response";
      } else {
        const { data, error } = await api.llm.deepseek.generate.post({
          contents: question,
          model: "deepseek-chat",
        });
        if (error) {
          setResult(`Error: ${JSON.stringify(error, null, 2)}`);
          return;
        }
        response = data?.text || "No response";
      }

      setResult(response);
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

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          className={buttonClass}
          onClick={handleGenerateContent}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : `调用 ${apiType === "gemini" ? "Gemini" : "DeepSeek"} API`}
        </Button>
      </div>

      {result && (
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};
