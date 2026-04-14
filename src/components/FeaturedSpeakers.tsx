
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SpeakerCard, { Speaker } from "./SpeakerCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const FeaturedSpeakers = () => {
  const { data: speakers, isLoading } = useQuery({
    queryKey: ["featured-speakers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speakers")
        .select("id, name, slug, role, themes, image_url, image_position, specialty")
        .eq("featured", true)
        .eq("archived", false)
        .order("featured_order", { ascending: true });

      if (error) throw error;
      return data as Speaker[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!speakers || speakers.length === 0) return null;

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {speakers.map((speaker) => (
          <CarouselItem key={speaker.id} className="pl-4 basis-[60%] sm:basis-[45%] md:basis-1/3 lg:basis-1/5">
            <SpeakerCard speaker={speaker} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex items-center justify-end gap-2 mt-6">
        <CarouselPrevious className="static translate-y-0 h-10 w-10 border-border/40 hover:bg-accent hover:text-accent-foreground" />
        <CarouselNext className="static translate-y-0 h-10 w-10 border-border/40 hover:bg-accent hover:text-accent-foreground" />
      </div>
    </Carousel>
  );
};

export default FeaturedSpeakers;
