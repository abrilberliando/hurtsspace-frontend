/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // unoptimized: true,

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
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            // 2. Avatar Google (Wajib buat Login Google)
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', 
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            // Tambahan domain yang sering kepake (Avatar & Placeholder)
            {
                protocol: 'https',
                hostname: 'ui-avatars.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            }
        ],
        
       
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
       
    },
};

export default nextConfig;