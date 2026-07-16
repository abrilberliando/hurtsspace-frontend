import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Definisikan tipe data sesuai respon API Laravel
export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  category?: { name: string };
  images: { image_url: string }[];
  is_new_arrival?: boolean;
  is_collab?: boolean;
}

export default function ProductCard({ item }: { item: Product }) {
  return (
    <Link href={`/products/${item.slug}`} className="group block h-full">
      <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-4 rounded-sm">
        {/* Gambar */}
        <img
          src={item.images[0]?.image_url || "/placeholder.jpg"}
          alt={item.name}
          className="object-cover w-full h-full group-hover:scale-105 transition duration-700 ease-in-out"
        />
        
        {/* Badges (New / Collab) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
            {item.is_new_arrival && (
                <Badge variant="secondary" className="bg-white text-black font-bold text-[10px] uppercase rounded-none hover:bg-white">
                    NEW
                </Badge>
            )}
            {item.is_collab && (
                <Badge variant="destructive" className="font-bold text-[10px] uppercase rounded-none">
                    COLLAB
                </Badge>
            )}
        </div>

        {/* Overlay Add to Cart (Optional aesthetic touch) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {item.category?.name || "Streetwear"}
        </p>
        <h3 className="text-sm font-bold uppercase tracking-wide leading-tight group-hover:underline underline-offset-4 decoration-zinc-500">
            {item.name}
        </h3>
        <p className="text-sm font-medium text-foreground">
            Rp {item.price.toLocaleString("id-ID")}
        </p>
      </div>
    </Link>
  );
}