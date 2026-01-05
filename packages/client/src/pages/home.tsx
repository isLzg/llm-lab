import { Button } from "@base-ui/react/button";
import { Link } from "react-router";

export const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
          LLM Lab
        </h1>
        <p className="text-center text-gray-600 mb-12">
          选择以下演示项目进行体验
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/chat-demo" className="block">
            <Button className="w-full h-24 text-lg font-semibold hover:scale-105 transition-transform">
              💬 Chat Demo
            </Button>
          </Link>
          
          <Link to="/api-demo" className="block">
            <Button className="w-full h-24 text-lg font-semibold hover:scale-105 transition-transform">
              🔌 API Demo
            </Button>
          </Link>
          
          <Link to="/video-demo" className="block">
            <Button className="w-full h-24 text-lg font-semibold hover:scale-105 transition-transform">
              🎥 Video Demo
            </Button>
          </Link>
          
          <Link to="/image-demo" className="block">
            <Button className="w-full h-24 text-lg font-semibold hover:scale-105 transition-transform">
              🖼️ Image Demo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

