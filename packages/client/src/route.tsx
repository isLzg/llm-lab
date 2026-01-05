import { createBrowserRouter } from "react-router";
import { ApiDemo, ChatDemo, VideoDemo } from "./components";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <ChatDemo />,
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
