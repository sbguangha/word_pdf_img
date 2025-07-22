import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用standalone输出模式，用于Docker部署
  output: 'standalone',

  // 图片优化配置
  images: {
    unoptimized: true, // 在Docker环境中禁用图片优化
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },

  // 服务器外部包配置
  serverExternalPackages: [],
};

export default nextConfig;
