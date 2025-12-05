import Hero from "@/components/shared/Hero";
import NewArrivals from "@/components/home/NewArrivals";
import BannerSplit from "@/components/home/BannerSplit";
import FeaturedProduct from "@/components/home/FeaturedProduct";
import HomeShop from "@/components/home/HomeShop";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <NewArrivals />
      <div className="py-10">
        <BannerSplit position={1} />
      </div>
      <div className="py-10">
        <FeaturedProduct />
      </div>
      <div className="py-10">
        <BannerSplit position={2} />
      </div>
      <div className="py-10">
        <HomeShop />
      </div>
    </main>
  );
}
