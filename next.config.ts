import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects: async () => [
    {
      source: "/why-nsoul",
      destination: "/our-vision",
      permanent: true,
    },
  ],
};

export default nextConfig;
