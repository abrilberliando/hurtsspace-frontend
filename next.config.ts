/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // 👇 INI OBAT PENAWARNYA G! 
        // Kita matiin dulu optimasi server Vercel biar gambar lo muncul lagi (bypass kuota)
        unoptimized: true,

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
        
        // formats & minimumCacheTTL gw komen dulu ya, 
        // soalnya percuma ada setting ini kalo unoptimized: true (gak bakal dipake sama Next.js)
        /*
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        */
    },
};

export default nextConfig;