/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/soft-stories',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
