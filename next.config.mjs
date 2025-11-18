/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  transpilePackages: ['next-mdx-remote'],

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '**/placeholder-image.png',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '**/placeholder-image.png',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '**/placeholder-image.png',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '**',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
