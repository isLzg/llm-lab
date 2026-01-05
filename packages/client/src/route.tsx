import { createBrowserRouter } from "react-router";
import { ApiDemo, ChatDemo, VideoDemo, ImageDemo } from "./components";

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
  {
    path: "/image-demo",
    element: <ImageDemo />,
  },
]);

export default routes;
