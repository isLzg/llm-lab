import { createBrowserRouter } from "react-router";
import { ApiDemo, GeminiDemo, VideoDemo } from "./components";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <GeminiDemo />,
  },
  {
    path: "/api-demo",
    element: <ApiDemo />,
  },
  {
    path: "/video-demo",
    element: <VideoDemo />,
  },
]);

export default routes;
