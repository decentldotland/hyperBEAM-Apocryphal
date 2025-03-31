/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');
const { globSync } = require('glob');

const nextConfig = {
  experimental: {
    // Enable turbo pack with full configuration
    turbo: {
      // Enable the turbo pack compiler
      loaders: {
        // Add special handling for JSON files
        '.json': ['json-loader'],
      },
    },
    // Copy data files to a location accessible during runtime
    outputFileTracingIncludes: {
      '/**': ['./src/data/**/*'],
    },
  },
  reactStrictMode: false,
  images: {
    domains: ['github.com'],
  },
  // Configure to properly handle the dual structure with renamed app directory
  async rewrites() {
    return [
      {
        source: '/src/app/:path*',
        destination: '/:path*',
      },
      {
        source: '/',
        destination: '/src/app',
      }
    ]
  },
  webpack(config) {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    
    // Modified: Don't disable Node.js modules entirely but provide mock implementations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: require.resolve('next/dist/compiled/node-libs-browser/mock/empty'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
    };
    
    // Add special handling for JSON data files
    config.module.rules.push({
      test: /\.json$/,
      include: path.resolve(__dirname, 'src/data'),
      type: 'javascript/auto',
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
            outputPath: 'static/data',
            publicPath: '/_next/static/data',
          },
        },
      ],
    });
    
    // Don't externalize modules that need to be bundled
    config.externals = [
      ...(config.externals || []),
      function({ context, request }, callback) {
        // Ensure these packages are bundled
        if (/mermaid|xterm|xterm-addon/.test(request)) {
          return callback();
        }
        callback(null, 'commonjs ' + request);
      },
    ];
    
    return config;
  },
  // Configure compiler to optimize output
  compiler: {
    styledComponents: true,
  },
  // Standard page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Ensure static data files are included in the build
  transpilePackages: ['src/data'],
};

module.exports = nextConfig;
