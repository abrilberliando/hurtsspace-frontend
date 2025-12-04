import Hero from "@/components/shared/Hero";
import NewArrivals from "@/components/home/NewArrivals";
import BannerSplit from "@/components/home/BannerSplit";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Hero />
      <BannerSplit position={1}/>
      <NewArrivals />
      <div className="py-10">
         <BannerSplit position={2} />
      </div>
    </main>
  );
}