import { Metadata, ResolvingMetadata } from "next";

// 👇 1. DEFINISI TIPE DATA (Biar Gak 'any')
interface ProductImage {
  image_url: string;
}

interface ProductVariant {
  stock: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

type Props = {
  // 👇 FIX: Params sekarang Promise di Next.js 15
  params: Promise<{ slug: string }>;
};

// Fungsi Fetch Data untuk Metadata (Server Side)
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`, { next: { revalidate: 60 } }); // Cache 60s
    const json = await res.json();
    const product = json.data; // Disini product masih any, tapi di metadata kita assign manual jadi aman

    if (!product) return { title: "Product Not Found" };

    const previousImages = (await parent).openGraph?.images || [];
    const productImage = product.images?.[0]?.image_url || "/og-image.jpg";

    return {
      title: product.name,
      description: product.description ? product.description.substring(0, 160) : "Hurtsspace product details.",
      openGraph: {
        title: `${product.name} | HURTSSPACE`,
        description: `Beli ${product.name} original hanya di Hurtsspace. Harga: Rp ${product.price.toLocaleString("id-ID")}`,
        images: [productImage, ...previousImages],
        type: 'website',
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.name} | HURTSSPACE`,
        description: `Beli ${product.name} original.`,
        images: [productImage],
      },
    };
  } catch {
    // 👇 FIX 2: Remove '(error)' because it is unused
    return { title: "Hurtsspace Product" };
  }
}

// 👇 UPDATE: Jadikan Layout Async untuk Fetch Data JSON-LD (Server Side Rendering)
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let jsonLd = null;

  // Fetch data again specifically for JSON-LD (Don't worry, Next.js automatically deduplicates the same requests)
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`, { next: { revalidate: 60 } });
    const json = await res.json();
    
    // 👇 FIX 3: Casting ke tipe Product biar TS tau isinya
    const product = json.data as Product;

    if (product) {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        // 👇 Remove ': any', TS already knows this is ProductImage[]
        "image": product.images.map((img) => img.image_url),
        "description": product.description,
        "sku": `HURTS-${product.id}`,
        "brand": { "@type": "Brand", "name": "HURTSSPACE" },
        "offers": {
          "@type": "Offer",
          "url": `https://hurtsspace.com/products/${slug}`, // Ganti domain asli nanti
          "priceCurrency": "IDR",
          "price": product.price,
          // 👇 Remove ': any', TS already knows this is ProductVariant[]
          "availability": product.variants.some((v) => v.stock > 0) 
            ? "https://schema.org/InStock" 
            : "https://schema.org/OutOfStock",
          "itemCondition": "https://schema.org/NewCondition"
        }
      };
    }
  } catch (error) {
    console.error("Failed to generate JSON-LD:", error);
  }

  return (
    <>
      {/* 👇 Script ini sekarang dirender di Server, jadi bakal muncul di View Page Source */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}