/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',         
      },
      {
        protocol: 'https',
        hostname: 'app.hurtsspace.com', 
      },

      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
};

export default nextConfig;