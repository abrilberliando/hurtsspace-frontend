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
            // 2. Google Avatar (Required for Google Login)
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com', 
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
            // Additional frequently used domains (Placeholder & Cloudinary)
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
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