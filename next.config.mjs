/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@anthropic-ai/sdk', 'pg'],
};

export default nextConfig;
