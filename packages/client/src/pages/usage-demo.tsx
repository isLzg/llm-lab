import { useState, useEffect } from "react";
import { Link } from "react-router";
import { api } from "../api/client";

interface UsageStats {
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  serviceBreakdown: Record<string, number>;
  modelBreakdown: Record<string, number>;
  requestCount: number;
  usageHistory: Array<{
    timestamp: number;
    service: string;
    model?: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>;
}

export const UsageDemo = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: apiError } = await api.usage.stats.get();
        if (apiError) {
          setError(`Error: ${JSON.stringify(apiError, null, 2)}`);
        } else if (data) {
          setStats(data);
        }
      } catch (err) {
        setError(`Exception: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("zh-CN").format(num);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <Link
        to="/"
        className="mb-4 text-blue-600 hover:text-blue-800 underline self-start"
      >
        ← 返回首页
      </Link>

      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          📊 Token 使用统计
        </h1>

        {loading && !stats && (
          <div className="text-blue-600 mb-4 text-center">加载中...</div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">总 Token 数</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatNumber(stats.totalTokens)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">输入 Token</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatNumber(stats.totalInputTokens)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">输出 Token</div>
                <div className="text-3xl font-bold text-purple-600">
                  {formatNumber(stats.totalOutputTokens)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">请求次数</div>
                <div className="text-3xl font-bold text-orange-600">
                  {formatNumber(stats.requestCount)}
                </div>
              </div>
            </div>

            {/* Service Breakdown */}
            {Object.keys(stats.serviceBreakdown).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  📈 服务使用分布
                </h2>
                <div className="space-y-2">
                  {Object.entries(stats.serviceBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([service, tokens]) => (
                      <div key={service} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-700">
                          {service}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-600 h-4 rounded-full"
                              style={{
                                width: `${(tokens / stats.totalTokens) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-32 text-right text-sm font-semibold text-gray-800">
                          {formatNumber(tokens)} tokens
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Model Breakdown */}
            {Object.keys(stats.modelBreakdown).length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  🤖 模型使用分布
                </h2>
                <div className="space-y-2">
                  {Object.entries(stats.modelBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([model, tokens]) => (
                      <div key={model} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium text-gray-700 truncate">
                          {model}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-purple-600 h-4 rounded-full"
                              style={{
                                width: `${(tokens / stats.totalTokens) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-32 text-right text-sm font-semibold text-gray-800">
                          {formatNumber(tokens)} tokens
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Usage History */}
            {stats.usageHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  📜 使用历史（最近 {Math.min(20, stats.usageHistory.length)}{" "}
                  条）
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 text-gray-700">
                          时间
                        </th>
                        <th className="text-left py-2 px-4 text-gray-700">
                          服务
                        </th>
                        <th className="text-left py-2 px-4 text-gray-700">
                          模型
                        </th>
                        <th className="text-right py-2 px-4 text-gray-700">
                          输入
                        </th>
                        <th className="text-right py-2 px-4 text-gray-700">
                          输出
                        </th>
                        <th className="text-right py-2 px-4 text-gray-700">
                          总计
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.usageHistory.slice(0, 20).map((usage) => (
                        <tr
                          key={`${usage.timestamp}-${usage.service}-${
                            usage.model || "none"
                          }`}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 px-4 text-gray-600">
                            {formatDate(usage.timestamp)}
                          </td>
                          <td className="py-2 px-4 text-gray-700 font-medium">
                            {usage.service}
                          </td>
                          <td className="py-2 px-4 text-gray-600">
                            {usage.model || "-"}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-600">
                            {formatNumber(usage.inputTokens)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-600">
                            {formatNumber(usage.outputTokens)}
                          </td>
                          <td className="py-2 px-4 text-right font-semibold text-gray-800">
                            {formatNumber(usage.totalTokens)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {stats.usageHistory.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-gray-500 text-lg">
                  暂无使用记录，开始使用 LLM 服务后，统计数据将显示在这里。
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
