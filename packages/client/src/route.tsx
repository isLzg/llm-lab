import { createBrowserRouter } from "react-router";
import {
  ApiDemo,
  ChatDemo,
  VideoDemo,
  ImageDemo,
  MastraDemo,
  UsageDemo,
  Home,
} from "./pages";

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
  {
    path: "/mastra-demo",
    element: <MastraDemo />,
  },
  {
    path: "/usage-demo",
    element: <UsageDemo />,
  },
]);

export default routes;
