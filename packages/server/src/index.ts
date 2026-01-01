import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok" }))
  // GET 端点：获取用户列表
  .get("/users", () => {
    return [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" },
    ];
  })
  // GET 端点：根据 ID 获取用户（带路径参数）
  .get(
    "/users/:id",
    ({ params }) => {
      const id = Number(params.id);
      return {
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // POST 端点：创建用户（带请求体验证）
  .post(
    "/users",
    ({ body }) => {
      return {
        id: Date.now(),
        ...body,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )
  // PUT 端点：更新用户（路径参数 + 请求体）
  .put(
    "/users/:id",
    ({ params, body }) => {
      return {
        id: Number(params.id),
        ...body,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    }
  )
  .listen(3000);

// 导出应用类型供客户端使用
export type App = typeof app;

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
