/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tinybooth/ui-tokens', '@tinybooth/api-types', '@tinybooth/api-client'],
  images: {
    remotePatterns: [
      // Allow R2 public bucket and the localhost dev server.
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
