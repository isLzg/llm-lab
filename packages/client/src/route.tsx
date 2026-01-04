import { createBrowserRouter } from "react-router";
import { ApiDemo, GeminiDemo } from "./components";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <GeminiDemo />,
  },
  {
    path: "/api-demo",
    element: <ApiDemo />,
  },
]);

export default routes;
