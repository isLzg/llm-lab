import { treaty } from "@elysiajs/eden";
import type { App } from "./types";

// 创建 Eden Treaty 客户端，连接到本地开发服务器
export const api = treaty<App>("http://localhost:3000");

