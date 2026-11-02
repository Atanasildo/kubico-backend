const BACKEND_HOST =
  process.env.NEXT_PUBLIC_API_URL
    ?.replace("/api/v1", "")
    ?.replace(/^https?:\/\//, "") ?? "";

const nextConfig = {
  images: {
    remotePatterns: [
      // S3 / AWS
      { protocol: "https", hostname: "*.amazonaws.com" },
      // Cloudflare R2
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Render backend (uploads served locally when no S3 configured)
      ...(BACKEND_HOST
        ? [{ protocol: "https", hostname: BACKEND_HOST }]
        : []),
      // Dev
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
