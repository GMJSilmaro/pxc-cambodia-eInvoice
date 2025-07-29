import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    //ppr: true,
    // Enable nodeMiddleware to resolve middleware runtime warning
    //nodeMiddleware: true,
    // Temporarily disable these experimental features to resolve webpack runtime errors
    // clientSegmentCache: true,
  }
};

export default nextConfig;
