import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["@greetings/shared", "@greetings/remotion"],
  async headers() {
    return [
      {
        source: "/((?!api|_next|.*\\.(?:png|jpg|jpeg|webp|svg|css|js|woff2|mp4|md)$).*)",
        headers: [
          {
            key: "Link",
            value:
              '</llms.txt>; rel="describedby", </llms-full.txt>; rel="describedby", </ai.txt>; rel="describedby"',
          },
        ],
      },
    ];
  },
};
export default nextConfig;
