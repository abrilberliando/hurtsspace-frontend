"use client";

import { useEffect, useState, Suspense, useRef, useMemo, memo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import { ShopCard } from "@/components/ShopCard";

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
  price: number | string;
  is_new_arrival: boolean | number | string;
  created_at?: string;
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

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
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

  // Memoize static options
  const sortOptions: DropdownOption[] = useMemo(() => [
    { value: "latest", label: "Latest Added" },
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
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch large limit at once for client-side filtering
        const res = await api.get("/products?limit=100"); 

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

          // 2. Cek Umur
          let isFresh = false;
          if (p.created_at) {
            const createdDate = new Date(p.created_at);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isFresh = diffDays <= NEW_ARRIVAL_LIMIT_DAYS;
          }

          return isFlagged || isFresh;
        });

        // Mapping biar tipe datanya konsisten boolean
        const mappedProducts: Product[] = newDrops.map((p) => ({
          ...p,
          is_new_arrival: true, // Because it's already filtered, it must be true for all contexts here
        }));

        setProducts(mappedProducts);
        setVisibleCount(16);
      } catch (error) {
        console.error("❌ Failed to fetch new arrivals:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 3. LOGIC PROCESSING (Filter Category & Sort)
  const processedProducts = useMemo(() => {
    let data = [...products];

    // Category Filter
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
        // Sort by ID desc (newest products on top)
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

  const handleCategoryChange = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") params.delete("category_id");
    else params.set("category_id", val);
    router.push(`/new-arrivals?${params.toString()}`);
  }, [router, searchParams]);

  const categoryOptions: DropdownOption[] = useMemo(() => [
    { value: "all", label: "Category: All" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ], [categories]);

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
            {Array.from({ length: 4 }).map((_, i) => (
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
                <ShopCard key={item.id} item={item as any} />
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
  );
}

// --- COMPONENTS ---

// 1. Custom Dropdown (Memoized)
const CustomDropdown = memo(function CustomDropdown({
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
  );
});
