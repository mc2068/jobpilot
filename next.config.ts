import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Resume PDFs go through the uploadResume action and may be up to 5MB;
      // the default limit is 1MB. The extra covers multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
