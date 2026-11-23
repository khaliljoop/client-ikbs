import type { NextConfig } from "next";
import { backendOrigin } from "./src/lib/api/origin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  headers() {
    return ["/dash/:path*", "/espace/:path*", "/espaces"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: "private, no-store" }],
    }));
  },
  rewrites() {
    return {
      beforeFiles: [
        { source: "/api/v1/:path*", destination: backendOrigin() + "/api/v1/:path*" },
      ],
    };
  },
};

export default nextConfig;
