import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 根据环境选择输出模式
  output: process.env.VERCEL ? undefined : 'standalone',

  // 图片优化配置
  images: {
    unoptimized: process.env.VERCEL ? false : true, // Vercel环境启用优化
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },

  // 服务器外部包配置
  serverExternalPackages: [],
};

export default nextConfig;
