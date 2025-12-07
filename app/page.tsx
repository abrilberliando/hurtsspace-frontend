import Hero from "@/components/shared/Hero";
import NewArrivals from "@/components/home/NewArrivals";
import BannerSplit from "@/components/home/BannerSplit";
import HomeShop from "@/components/home/HomeShop";
import HomeLookbook from "@/components/home/HomeLookBook";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <NewArrivals />
        <BannerSplit position={1} />
        <HomeLookbook />
        <BannerSplit position={2} />
        <HomeShop />
    </main>
  );
}
