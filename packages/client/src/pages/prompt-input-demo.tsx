import { Link } from "react-router";
import { PromptInput } from "../components/prompt-input";

export const PromptInputDemo = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <Link to="/" className="mb-4 text-blue-600 hover:text-blue-800 underline">
        ← 返回首页
      </Link>
      <h1 className="text-2xl font-bold mb-6">Prompt Input Demo</h1>

      <div className="w-full max-w-full sm:max-w-[768px] sm:min-w-[390px] mx-auto mt-[20vh]">
        <PromptInput />
      </div>
    </div>
  );
};
