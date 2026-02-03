import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rolly-shop-bucket.s3.ap-southeast-2.amazonaws.com',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'devit.tail473287.ts.net',
        port: '',
        pathname: '/api/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: '*.tail473287.ts.net',
        port: '',
        pathname: '/api/v1/files/**',
      },
    ],
  },
};

export default nextConfig;
