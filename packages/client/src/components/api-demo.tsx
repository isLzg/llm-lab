import { Button } from "@base-ui/react/button";
import { useState } from "react";
import { api } from "../api/client";

export const ApiDemo = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // GET 请求：获取用户列表
  const handleGetUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.demos.get();
      if (error) {
        setResult(`Error: ${JSON.stringify(error, null, 2)}`);
      } else {
        setResult(`Users: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // GET 请求：根据 ID 获取用户（带路径参数）
  const handleGetUserById = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.demos({ id: "1" }).get();
      if (error) {
        setResult(`Error: ${JSON.stringify(error, null, 2)}`);
      } else {
        setResult(`User: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // POST 请求：创建用户
  const handleCreateUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.demos.post({
        name: "Charlie",
        email: "charlie@example.com",
      });
      if (error) {
        setResult(`Error: ${JSON.stringify(error, null, 2)}`);
      } else {
        setResult(`Created User: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // PUT 请求：更新用户
  const handleUpdateUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.demos({ id: "1" }).put({
        name: "Alice Updated",
        email: "alice.updated@example.com",
      });
      if (error) {
        setResult(`Error: ${JSON.stringify(error, null, 2)}`);
      } else {
        setResult(`Updated User: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // GET 请求：健康检查
  const handleHealthCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.health.get();
      if (error) {
        setResult(`Error: ${JSON.stringify(error, null, 2)}`);
      } else {
        setResult(`Health: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setResult(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const buttonClass =
    "flex items-center justify-center h-10 px-3.5 m-1 outline-0 border border-gray-200 rounded-md bg-gray-50 font-inherit text-base font-medium leading-6 text-gray-900 select-none hover:data-[disabled]:bg-gray-50 hover:bg-gray-100 active:data-[disabled]:bg-gray-50 active:bg-gray-200 active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] active:border-t-gray-300 active:data-[disabled]:shadow-none active:data-[disabled]:border-t-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 focus-visible:-outline-offset-1 data-[disabled]:text-gray-500";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Eden Treaty API Demo</h1>
      <p className="text-gray-600 mb-4">
        端到端类型安全的 API 调用示例
      </p>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          className={buttonClass}
          onClick={handleHealthCheck}
          disabled={loading}
        >
          Health Check
        </Button>
        <Button
          className={buttonClass}
          onClick={handleGetUsers}
          disabled={loading}
        >
          Get Users (GET)
        </Button>
        <Button
          className={buttonClass}
          onClick={handleGetUserById}
          disabled={loading}
        >
          Get User by ID (GET)
        </Button>
        <Button
          className={buttonClass}
          onClick={handleCreateUser}
          disabled={loading}
        >
          Create User (POST)
        </Button>
        <Button
          className={buttonClass}
          onClick={handleUpdateUser}
          disabled={loading}
        >
          Update User (PUT)
        </Button>
      </div>

      {loading && (
        <div className="text-blue-600 mb-4">Loading...</div>
      )}

      {result && (
        <div className="w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

