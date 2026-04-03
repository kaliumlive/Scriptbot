import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  distDir: process.env.NEXT_DIST_DIR || '.next',
  serverExternalPackages: [
    '@sparticuz/chromium-min',
    'puppeteer-core',
    'ffmpeg-static',
    'fluent-ffmpeg',
    '@ffmpeg/ffmpeg',
    '@ffmpeg/util',
  ],
};

export default nextConfig;
