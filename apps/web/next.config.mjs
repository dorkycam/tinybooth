/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@tinybooth/ui-tokens', '@tinybooth/messages', '@tinybooth/api-types'],
};

export default nextConfig;
