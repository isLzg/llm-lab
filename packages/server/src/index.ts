import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { demos } from "./modules/demos";
import { llm } from "./modules/llm";
import { usage } from "./modules/usage";

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia")
  .get("/health", () => ({ status: "ok" }))
  .use(demos)
  .use(llm)
  .use(usage)
  .listen(3000);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
