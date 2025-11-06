import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Demo page to showcase the new login design
 * This is NOT the actual login page - just for preview
 */
export default function LoginDemo() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d7a7a] to-[#00b894]">
      <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#2d7a7a] to-[#00b894] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-white p-3 rounded-xl">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-24 w-24 object-contain"
              />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-[#1e3a5f] to-[#2d7a7a] bg-clip-text text-transparent">
              {APP_TITLE.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </h1>
            <p className="text-sm text-gray-600 font-medium">
              Construction Management & QC Platform
            </p>
            <p className="text-xs text-gray-500">
              กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-[#2d7a7a] to-[#00b894] hover:from-[#1e3a5f] hover:to-[#2d7a7a] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          เข้าสู่ระบบ
        </Button>
        <p className="text-xs text-gray-400 text-center">
          Powered by A.O. Construction and Engineering
        </p>
      </div>
    </div>
  );
}
