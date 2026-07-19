import { MetadataRoute } from 'next';

// 👇 1. Define Product Data Type for Sitemap
interface ProductSitemap {
  slug: string;
  updated_at: string;
}

// Function to get all products
async function getProducts(): Promise<ProductSitemap[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?limit=1000`, { 
        next: { revalidate: 3600 } 
    });
    const data = await res.json();
    // Casting hasil fetch ke tipe array ProductSitemap
    return (data.data.data as ProductSitemap[]) || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const baseUrl = 'https://hurtsspace.com'; // Ganti domain asli nanti

  // 1. Static Pages
  const staticPages = [
    '',
    '/shopall',
    '/shop',
    '/lookbook',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Product Pages
  const productPages = products.map((product) => ({ // TS otomatis tau tipe 'product' dari getProducts()
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...productPages];
}