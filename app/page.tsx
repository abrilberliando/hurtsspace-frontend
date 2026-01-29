import Hero from "@/components/shared/Hero";
import NewArrivals from "@/components/home/NewArrivals";
import BannerSplit from "@/components/home/BannerSplit";
import HomeShop from "@/components/home/HomeShop";
import HomeLookbook from "@/components/home/HomeLookBook";
import VideoBanner from "@/components/home/VideoBanner";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <BannerSplit position={1} /> 
      <NewArrivals />
        <VideoBanner />
        <HomeLookbook /> 
        <HomeShop />
    </main>
  );
}
