import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["@greetings/shared", "@greetings/remotion"],
};
export default nextConfig;
