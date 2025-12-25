"use client";

import { useEffect, useState, Suspense, useRef, useMemo, memo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Check } from "lucide-react";
import Image from "next/image";

// --- INTERFACES ---
interface Variant {
  id: number;
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  is_new_arrival: boolean;
  images: { image_url: string }[];
  variants: Variant[];
  category_id?: number | string;
  category?: { id: number | string; name: string };
}

interface Category {
  id: number | string;
  name: string;
  slug?: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

// --- GLOBAL HELPERS (Hemat Memory) ---
const parsePrice = (value: number | string): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleanString = value.toString().replace(/\D/g, "");
  return parseInt(cleanString) || 0;
};

const displayPrice = (val: string | number): number => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return 0;
  return Math.floor(num);
};

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground uppercase tracking-widest text-sm">
          Loading Shop...
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params URL
  const categoryId = searchParams.get("category_id");
  const searchQuery = searchParams.get("search");

  // State Data
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // State Filter & Pagination
  const [sortBy, setSortBy] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(16);

  // Memoize options biar gak dibuat ulang tiap render
  const sortOptions: DropdownOption[] = useMemo(() => [
    { value: "latest", label: "Latest Arrivals" },
    { value: "alphabet_asc", label: "Name (A - Z)" },
    { value: "alphabet_desc", label: "Name (Z - A)" },
    { value: "price_asc", label: "Price (Low - High)" },
    { value: "price_desc", label: "Price (High - Low)" },
  ], []);

  // 1. Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        const cats = Array.isArray(res.data) ? res.data : res.data.data || [];
        setCategories(cats);
      } catch (err) {
        console.error("Gagal load kategori:", err);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const url = "/products";
        const params = new URLSearchParams();

        if (categoryId && categoryId !== "all")
          params.append("category_id", categoryId);

        if (searchQuery) {
          params.append("search", searchQuery);
          // 👇 TAMBAH LIMIT GEDE PAS SEARCH
          params.append("limit", "100");
        }

        const res = await api.get(`${url}?${params.toString()}`);

        let dataFix: Product[] = [];
        if (Array.isArray(res.data)) dataFix = res.data;
        else if (Array.isArray(res.data?.data)) dataFix = res.data.data;
        else if (Array.isArray(res.data?.data?.data))
          dataFix = res.data.data.data;

        setAllProducts(dataFix);
        setVisibleCount(16);
      } catch (error) {
        console.error("❌ Gagal fetch products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, searchQuery]);

  // 3. LOGIC FILTERING & SORTING (Optimized)
  const processedProducts = useMemo(() => {
    let data = [...allProducts];

    // A. STRICT SEARCH FILTER (Client-side)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter((item) =>
        item.name.toLowerCase().includes(lowerQuery)
      );
    }

    // B. FILTER KATEGORI (Fallback Client-side)
    if (categoryId && categoryId !== "all") {
      data = data.filter((p) => {
        const productCatId = p.category_id || p.category?.id;
        return String(productCatId) === String(categoryId);
      });
    }

    // C. SORTING
    switch (sortBy) {
      case "price_asc":
        return data.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case "price_desc":
        return data.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case "alphabet_asc":
        return data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "alphabet_desc":
        return data.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      case "latest":
      default:
        return data.sort((a, b) => b.id - a.id);
    }
  }, [allProducts, sortBy, categoryId, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(16);
  }, [sortBy, categoryId, searchQuery]);

  const visibleProducts = processedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < processedProducts.length;

  // Handlers
  const handleLoadMore = () => setVisibleCount((prev) => prev + 8);

  const handleCategoryChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") params.delete("category_id");
    else params.set("category_id", val);
    router.push(`/shop?${params.toString()}`);
  };

  // Prepare Options for Custom Dropdown
  const categoryOptions: DropdownOption[] = useMemo(() => [
    { value: "all", label: "Category: All" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ], [categories]);

  // --- LOGIC DYNAMIC TITLE ---
  const pageTitle = useMemo(() => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (categoryId && categoryId !== "all") {
      const activeCat = categories.find((c) => String(c.id) === categoryId);
      return activeCat ? activeCat.name : "Shop";
    }
    if (sortBy && sortBy !== "latest") {
      const activeSort = sortOptions.find((s) => s.value === sortBy);
      return activeSort ? activeSort.label : "Shop All";
    }
    return "Shop All";
  }, [searchQuery, categoryId, sortBy, categories, sortOptions]);

  return (
    <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
      <div className="container mx-auto px-4">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          {/* Kiri: Judul Dinamis */}
          <div className="text-center md:text-left w-full md:w-auto">
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {processedProducts.length} items found
            </p>
          </div>

          {/* Kanan: Filter & Sort */}
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-30">
            <CustomDropdown
              options={categoryOptions}
              value={categoryId || "all"}
              onChange={handleCategoryChange}
              placeholder="Select Category"
              className="w-full sm:w-[220px]"
            />

            <CustomDropdown
              options={sortOptions}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              placeholder="Sort By"
              className="w-full sm:w-[240px]"
            />
          </div>
        </div>

        {/* GRID PRODUK */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 justify-items-center">
            {/* Optimized Array.from */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-full max-w-[350px] space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-lg bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
                <Skeleton className="h-4 w-1/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : visibleProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 gap-y-8 md:gap-8 md:gap-y-12 justify-items-center z-0">
              {visibleProducts.map((item) => (
                // Pake Memoized Component
                <ShopCardMemo key={item.id} item={item} />
              ))}
            </div>

            {/* LOAD MORE BUTTON */}
            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  className="px-12 h-14 border-foreground text-foreground font-bold hover:bg-foreground hover:text-background transition-all tracking-widest text-sm rounded-none w-full md:w-auto uppercase"
                >
                  Load More
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Showing {visibleProducts.length} of {processedProducts.length}{" "}
                  products
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center border border-dashed border-zinc-700 rounded-xl">
            <h2 className="text-xl font-bold mb-2">No products found.</h2>
            <p className="text-muted-foreground mb-6">
              Try changing your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                handleCategoryChange("all");
                setSortBy("latest");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

// --- COMPONENT: CUSTOM DROPDOWN ---
// Dibungkus memo biar gak re-render kalau parent (ShopContent) update state lain
const CustomDropdown = memo(function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select",
  className = "",
}: {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative group ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full 
          bg-background border border-border 
          px-4 py-2.5 text-sm font-medium uppercase tracking-wide
          transition-all duration-200 ease-in-out
          hover:border-foreground focus:outline-none 
          ${isOpen ? "ring-1 ring-foreground border-foreground" : ""}
          rounded-none cursor-pointer
        `}
      >
        <span className="truncate mr-2 text-foreground">{selectedLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
            isOpen ? "rotate-180 text-foreground" : ""
          }`}
        />
      </button>

      <div
        className={`
          absolute z-[60] left-0 right-0 top-[calc(100%+4px)] 
          bg-background border border-border 
          shadow-2xl max-h-[300px] overflow-y-auto
          transition-all duration-200 origin-top
          ${
            isOpen
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
          }
        `}
      >
        <ul className="py-1">
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`
                relative px-4 py-3 text-sm font-medium cursor-pointer uppercase tracking-wide
                transition-colors duration-150 border-t border-border/10 first:border-0
                hover:bg-foreground hover:text-background
                ${
                  value === opt.value
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span>{opt.label}</span>
                {value === opt.value && <Check className="h-3.5 w-3.5" />}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

// --- COMPONENT: SHOP CARD (ULTRA OPTIMIZED) ---
function ShopCard({ item }: { item: Product }) {
  const images = item.images || [];
  const variants = item.variants || [];

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref buat nyimpen ukuran element (Reflow Saver!)
  const boundsRef = useRef<DOMRect | null>(null);

  // 1. Calculate bounds ONLY on mouse enter
  const handleMouseEnter = useCallback(() => {
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
  }, []);

  // 2. Logic hover ringan tanpa getBoundingClientRect() berulang
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (images.length <= 1 || !boundsRef.current) return;

    const { left, width } = boundsRef.current;
    if (width === 0) return;

    const x = e.clientX - left;
    const percentage = x / width;
    const index = Math.floor(percentage * images.length);
    const safeIndex = Math.min(Math.max(index, 0), images.length - 1);

    setActiveIndex((prev) => (prev !== safeIndex ? safeIndex : prev));
  }, [images.length]);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(0);
    boundsRef.current = null; // Cleanup
  }, []);

  return (
    <div className="w-full max-w-[350px] group relative select-none will-change-transform">
      {/* IMAGE */}
      <div
        ref={containerRef}
        className="relative aspect-[3/4] bg-white overflow-hidden rounded-md mb-3 md:mb-4 cursor-pointer transform-gpu"
        onMouseEnter={handleMouseEnter} // Trigger calc here
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Link
          href={`/products/${item.slug}`}
          className="block w-full h-full relative"
        >
          {images.length > 0 ? (
            images.map((img, idx) => (
              <Image
                key={idx}
                src={img.image_url}
                alt={`${item.name} - ${idx}`}
                fill
                // Optimization: sizes accurate for grid
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`
                  absolute inset-0 w-full h-full object-contain object-center 
                  transition-opacity duration-300 ease-in-out
                  ${
                    idx === activeIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }
                `}
                draggable={false}
                priority={idx === 0}
                loading={idx === 0 ? "eager" : "lazy"}
                quality={60} // Sedikit diturunin biar enteng
              />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-lg md:text-2xl">
              HURTS
            </div>
          )}
        </Link>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full shadow-sm backdrop-blur-sm transition-all duration-300 ${
                  i === activeIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="space-y-1 px-1">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold uppercase text-xs md:text-sm tracking-wide leading-tight truncate">
              <Link
                href={`/products/${item.slug}`}
                className="hover:underline underline-offset-4"
              >
                {item.name}
              </Link>
            </h3>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 truncate">
              {item.category?.name || "Streetwear"}
            </p>
          </div>
          {/* Pake global helper */}
          <p className="text-xs md:text-sm font-bold whitespace-nowrap">
            Rp {displayPrice(item.price).toLocaleString("id-ID")}
          </p>
        </div>

        {/* SIZE */}
        <div className="flex flex-wrap gap-1 pt-1">
          {variants.length > 0 ? (
            variants.map((variant) => {
              const isAvailable = variant.stock > 0;
              return (
                <span
                  key={variant.id}
                  className={`
                    text-[9px] md:text-[10px] px-1.5 py-0.5 border rounded-sm font-medium transition-colors
                    ${
                      isAvailable
                        ? "border-zinc-700 text-foreground cursor-default"
                        : "border-border text-muted-foreground/50 line-through bg-muted/30 cursor-not-allowed"
                    }
                  `}
                >
                  {variant.size}
                </span>
              );
            })
          ) : (
            <span className="text-[9px] md:text-[10px] text-muted-foreground italic">
              No size info
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
const ShopCardMemo = memo(ShopCard);