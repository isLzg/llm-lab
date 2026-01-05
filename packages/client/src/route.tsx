import { createBrowserRouter } from "react-router";
import { ApiDemo, ChatDemo, VideoDemo, ImageDemo, Home } from "./pages";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/chat-demo",
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
