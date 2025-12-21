"use client";

import { useEffect, useState, Suspense, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Check } from "lucide-react";

const NEW_ARRIVAL_LIMIT_DAYS = 90;

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
  // 👇 Allow string/number buat handling data mentah
  price: number | string;
  is_new_arrival: boolean | number | string;
  created_at?: string; // 👇 Wajib buat hitung umur barang
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

// Interface props buat CustomDropdown
interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function NewArrivalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground uppercase tracking-widest text-sm">
          Loading New Drops...
        </div>
      }
    >
      <NewArrivalsContent />
    </Suspense>
  );
}

function NewArrivalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params
  const categoryId = searchParams.get("category_id");

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort
  const [sortBy, setSortBy] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(16);

  const sortOptions: DropdownOption[] = [
    { value: "latest", label: "Latest Added" },
    { value: "price_asc", label: "Price (Low - High)" },
    { value: "price_desc", label: "Price (High - Low)" },
  ];

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
        const res = await api.get("/products"); // Ambil semua, filter di client

        // 👇 FIX: Ganti 'any[]' jadi 'Product[]' biar type-safe & ESLint seneng
        let dataFix: Product[] = [];
        if (Array.isArray(res.data)) dataFix = res.data;
        else if (Array.isArray(res.data?.data)) dataFix = res.data.data;
        else if (Array.isArray(res.data?.data?.data))
          dataFix = res.data.data.data;

        // 👇 LOGIC FILTER "NEW DROPS" (GABUNGAN DB & UMUR)
        const newDrops = dataFix.filter((p) => {
          // 1. Cek Flag Database
          const isFlagged =
            p.is_new_arrival === 1 ||
            p.is_new_arrival === "1" ||
            p.is_new_arrival === true;

          // 2. Cek Umur (30 Hari)
          let isFresh = false;
          if (p.created_at) {
            const createdDate = new Date(p.created_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isFresh = diffDays <= NEW_ARRIVAL_LIMIT_DAYS;
          }

          return isFlagged || isFresh; // Masuk list kalau salah satu terpenuhi
        });

        // Mapping biar tipe datanya aman
        const mappedProducts: Product[] = newDrops.map((p) => ({
          ...p,
          is_new_arrival:
            p.is_new_arrival === 1 ||
            p.is_new_arrival === "1" ||
            p.is_new_arrival === true,
        }));

        setProducts(mappedProducts);
        setVisibleCount(16);
      } catch (error) {
        console.error("❌ Gagal fetch new arrivals:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // --- HELPER ---
  const parsePrice = (value: number | string): number => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    const cleanString = value.toString().replace(/\D/g, "");
    return parseInt(cleanString) || 0;
  };

  // 3. LOGIC PROCESSING (Filter Category & Sort)
  const processedProducts = useMemo(() => {
    let data = [...products];

    // Filter Kategori
    if (categoryId && categoryId !== "all") {
      data = data.filter((p) => {
        const productCatId = p.category_id || p.category?.id;
        return String(productCatId) === String(categoryId);
      });
    }

    // Sorting
    switch (sortBy) {
      case "price_asc":
        return data.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case "price_desc":
        return data.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case "latest":
      default:
        // Sort by ID desc (produk terbaru di atas)
        return data.sort((a, b) => b.id - a.id);
    }
  }, [products, categoryId, sortBy]);

  // Reset pagination
  useEffect(() => {
    setVisibleCount(16);
  }, [categoryId, sortBy]);

  const visibleProducts = processedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < processedProducts.length;
  const handleLoadMore = () => setVisibleCount((prev) => prev + 8);

  const handleCategoryChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") params.delete("category_id");
    else params.set("category_id", val);
    router.push(`/new-arrivals?${params.toString()}`);
  };

  const categoryOptions: DropdownOption[] = [
    { value: "all", label: "Category: All" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ];

  // Logic Title
  const pageTitle = useMemo(() => {
    const base = "New Arrivals";
    if (categoryId && categoryId !== "all") {
      const activeCat = categories.find((c) => String(c.id) === categoryId);
      return activeCat ? `${base}: ${activeCat.name}` : base;
    }
    return base;
  }, [categoryId, categories]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen bg-background text-foreground pt-10 pb-20">
        <div className="container mx-auto px-4">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="text-center md:text-left w-full md:w-auto">
              <h1 className="text-2xl font-black tracking-tighter uppercase">
                {pageTitle}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {processedProducts.length} fresh drops available
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-30">
              <CustomDropdown
                options={categoryOptions}
                value={categoryId || "all"}
                onChange={handleCategoryChange}
                placeholder="Filter Category"
                className="w-full sm:w-[220px]"
              />

              <CustomDropdown
                options={sortOptions}
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                placeholder="Sort By"
                className="w-full sm:w-60"
              />
            </div>
          </div>

          {/* GRID */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8 justify-items-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-full max-w-[350px] space-y-3">
                  <Skeleton className="aspect-3/4 w-full rounded-lg bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                </div>
              ))}
            </div>
          ) : visibleProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 gap-y-8 md:gap-8 md:gap-y-12 justify-items-center z-0">
                {visibleProducts.map((item) => (
                  <ShopCard key={item.id} item={item} />
                ))}
              </div>

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
                </div>
              )}
            </>
          ) : (
            <div className="py-32 text-center border border-dashed border-zinc-700 rounded-xl">
              <h2 className="text-xl font-bold mb-2">No new drops yet.</h2>
              <p className="text-muted-foreground mb-6">
                Check back later for fresh gear.
              </p>
              <Button variant="outline" onClick={() => router.push("/shop")}>
                Back to Shop
              </Button>
            </div>
          )}
        </div>
      </main>
    </Suspense>
  );
}

// --- COMPONENTS ---

// 1. Custom Dropdown
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select",
  className = "",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={`relative group ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full bg-background border border-border px-4 py-2.5 text-sm font-medium uppercase tracking-wide transition-all duration-200 ease-in-out hover:border-foreground focus:outline-none ${
            isOpen ? "ring-1 ring-foreground border-foreground" : ""
          } rounded-none cursor-pointer`}
        >
          <span className="truncate mr-2 text-foreground">{selectedLabel}</span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
              isOpen ? "rotate-180 text-foreground" : ""
            }`}
          />
        </button>
        <div
          className={`absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-background border border-border shadow-2xl max-h-[300px] overflow-y-auto transition-all duration-200 origin-top ${
            isOpen
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
          }`}
        >
          <ul className="py-1">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`relative px-4 py-3 text-sm font-medium cursor-pointer uppercase tracking-wide transition-colors duration-150 border-t border-border/10 first:border-0 hover:bg-foreground hover:text-background ${
                  value === opt.value
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground"
                }`}
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
    </Suspense>
  );
}

// 2. Shop Card (Updated Logic Badge NEW)
function ShopCard({ item }: { item: Product }) {
  const images = item.images || [];
  const variants = item.variants || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || images.length <= 1) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const percentage = x / width;
    const index = Math.floor(percentage * images.length);
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1));
  };

  // Helper display price
  const displayPrice = (val: string | number): number => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num)) return 0;
        return Math.floor(num); 
    };

  // 👇 SMART LOGIC: 30 HARI RULE ATAU DATABASE FLAG
  const isNewCalculated = useMemo(() => {
    // 1. Cek Boolean dari DB
    const val = item.is_new_arrival;
    if (val === 1 || val === "1" || val === true || val === "true") return true;

    // 2. Fallback: Hitung Umur (30 Hari)
    if (item.created_at) {
      const createdDate = new Date(item.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays <= NEW_ARRIVAL_LIMIT_DAYS; 
    }
    return false;
  }, [item.is_new_arrival, item.created_at]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="w-full max-w-[350px] group relative select-none">
        <div
          ref={containerRef}
          className="relative aspect-3/4 bg-white overflow-hidden rounded-md mb-3 md:mb-4 cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActiveIndex(0)}
        >
          <Link
            href={`/products/${item.slug}`}
            className="block w-full h-full relative"
          >
            {images.length > 0 ? (
              images.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={img.image_url}
                  alt={`${item.name}-${idx}`}
                  className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-300 ease-in-out ${
                    idx === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                  draggable={false}
                />
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 font-bold text-lg md:text-2xl">
                HURTS
              </div>
            )}
          </Link>
          {isNewCalculated && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-20">
              New
            </div>
          )}
        </div>
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
            {/* 👇 UPDATE: Pake displayPrice disini */}
            <p className="text-xs md:text-sm font-bold whitespace-nowrap">
              Rp {displayPrice(item.price).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {variants.length > 0 ? (
              variants.map((v) => (
                <span
                  key={v.id}
                  className={`text-[9px] md:text-[10px] px-1.5 py-0.5 border rounded-sm font-medium ${
                    v.stock > 0
                      ? "border-zinc-700 text-foreground"
                      : "border-border text-muted-foreground/50 line-through bg-muted/30"
                  }`}
                >
                  {v.size}
                </span>
              ))
            ) : (
              <span className="text-[9px] text-muted-foreground italic">
                No size info
              </span>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
