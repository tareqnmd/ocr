/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle Tesseract.js worker files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Handle binary files for Tesseract
    config.module.rules.push({
      test: /\.(wasm|traineddata)$/,
      type: 'asset/resource',
    })

    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js'],
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default nextConfig
