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
        // 👇 INI JURUS RAHASIANYA G! 
        // Memaksa Next.js convert gambar jadi AVIF (Paling kecil) -> WebP -> Asli
        formats: ['image/avif', 'image/webp'],
        
        // Cache gambar di server Next.js selama 60 detik biar gak spam request ke Laravel
        minimumCacheTTL: 60,
    },
};

export default nextConfig;