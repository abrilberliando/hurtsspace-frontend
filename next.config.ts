/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost', // Kalau backend di localhost
        port: '8000',          // Port backend (sesuaikan)
      },
      {
        protocol: 'https',
        hostname: '**.example.com', // Kalau backend udah online
      },
      // Kalau pake placeholder sementara:
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
};

export default nextConfig;