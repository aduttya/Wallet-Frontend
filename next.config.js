/** @type {import('next').NextConfig} */

//const { createProxyMiddleware } = require('http-proxy-middleware');

const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig

// module.exports = {
//   reactStrictMode: true,
//   async rewrites() {
//     return [
//       {
//         source: '/api/:path*',
//         destination: 'http://localhost:3001/api/:path*', // Proxy to Backend
//       },
//     ];
//   },
// };
