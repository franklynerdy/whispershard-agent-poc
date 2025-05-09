import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ImageAsset = {
  id: string;
  assetId: string;
  url: string;
  caption: string;
  source: string;
};

type ImageCarouselProps = {
  searchTerm?: string;
};

export default function ImageCarousel({ searchTerm }: ImageCarouselProps) {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ImageAsset | null>(null);
  
  const { toast } = useToast();
  
  // Effect to fetch images when search term changes
  useEffect(() => {
    if (searchTerm) {
      fetchImages(searchTerm);
    }
  }, [searchTerm]);
  
  const fetchImages = async (term: string) => {
    setIsLoading(true);
    
    try {
      // This will be replaced with actual API call
      // const response = await fetch(`/api/search-images?q=${encodeURIComponent(term)}`);
      
      // For demonstration purposes, we'll mock a response
      await new Promise(resolve => setTimeout(resolve, 1300)); // simulate network delay
      
      // Mock different images based on the search term
      let mockImages: ImageAsset[] = [];
      
      // Different mock images based on common RPG terms
      if (term.toLowerCase().includes("dragon")) {
        mockImages = [
          {
            id: "d1",
            assetId: "dragon_red",
            url: "https://images.unsplash.com/photo-1577368211130-4bbb935f0d77?w=600&auto=format&fit=crop",
            caption: "Ancient Red Dragon",
            source: "Monster Manual"
          },
          {
            id: "d2",
            assetId: "dragon_cave",
            url: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=600&auto=format&fit=crop",
            caption: "Dragon's Lair",
            source: "DM Guide"
          },
          {
            id: "d3",
            assetId: "dragon_hoard",
            url: "https://images.unsplash.com/photo-1633066886500-4e2517b3e10f?w=600&auto=format&fit=crop",
            caption: "Dragon's Hoard",
            source: "Treasure of Legends"
          },
          {
            id: "d4",
            assetId: "dragon_flight",
            url: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop",
            caption: "Dragon in Flight",
            source: "Creatures of the Sky"
          }
        ];
      } else if (term.toLowerCase().includes("forest") || term.toLowerCase().includes("woods")) {
        mockImages = [
          {
            id: "f1",
            assetId: "enchanted_forest",
            url: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&auto=format&fit=crop",
            caption: "Enchanted Forest",
            source: "Nature's Mystique"
          },
          {
            id: "f2",
            assetId: "forest_path",
            url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop",
            caption: "Forest Path",
            source: "Traveler's Guide"
          },
          {
            id: "f3",
            assetId: "dark_woods",
            url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop",
            caption: "Dark Woods",
            source: "Shadows & Whispers"
          },
          {
            id: "f4",
            assetId: "forest_cabin",
            url: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=600&auto=format&fit=crop",
            caption: "Abandoned Cabin",
            source: "Forgotten Places"
          }
        ];
      } else if (term.toLowerCase().includes("castle") || term.toLowerCase().includes("fortress")) {
        mockImages = [
          {
            id: "c1",
            assetId: "castle_mountain",
            url: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=600&auto=format&fit=crop",
            caption: "Mountain Fortress",
            source: "Strongholds & Sieges"
          },
          {
            id: "c2",
            assetId: "castle_ruins",
            url: "https://images.unsplash.com/photo-1568411341116-a2c49114bb6f?w=600&auto=format&fit=crop",
            caption: "Ancient Ruins",
            source: "Lost Civilizations"
          },
          {
            id: "c3",
            assetId: "castle_throne",
            url: "https://images.unsplash.com/photo-1567627013555-2fa8c3b1f022?w=600&auto=format&fit=crop",
            caption: "Royal Throne Room",
            source: "Halls of Power"
          },
          {
            id: "c4",
            assetId: "castle_gate",
            url: "https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=600&auto=format&fit=crop",
            caption: "Castle Gatehouse",
            source: "Entryways & Defenses"
          }
        ];
      } else {
        // Default images for other terms
        mockImages = [
          {
            id: "g1",
            assetId: "fantasy_landscape",
            url: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&auto=format&fit=crop",
            caption: "Fantasy Landscape",
            source: "World Atlas"
          },
          {
            id: "g2",
            assetId: "adventure_map",
            url: "https://images.unsplash.com/photo-1566959828017-f4e83e8f6cd1?w=600&auto=format&fit=crop",
            caption: "Adventure Map",
            source: "Cartographer's Guide"
          },
          {
            id: "g3",
            assetId: "treasure_chest",
            url: "https://images.unsplash.com/photo-1629985858879-399a53bc964b?w=600&auto=format&fit=crop",
            caption: "Treasure Chest",
            source: "Loot & Rewards"
          },
          {
            id: "g4",
            assetId: "tavern_interior",
            url: "https://images.unsplash.com/photo-1592088169513-89c037a761c1?w=600&auto=format&fit=crop",
            caption: "Tavern Interior",
            source: "Places of Respite"
          }
        ];
      }
      
      setImages(mockImages);
      
    } catch (error) {
      console.error("Error fetching images:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const openLightbox = (image: ImageAsset) => {
    setLightboxImage(image);
    setShowLightbox(true);
  };
  
  const closeLightbox = () => {
    setShowLightbox(false);
    setLightboxImage(null);
  };
  
  // If no images are available yet
  if (images.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Gallery</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Mention a monster, location, or item in your chat to see related images.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={() => fetchImages("dragon")}
              >
                Show Example Images
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Image Gallery</h2>
      
      {/* Carousel */}
      <div className="relative">
        <div className="overflow-hidden rounded-lg">
          <div className="relative h-64 md:h-80">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-300 image-card ${
                  index === activeImageIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => openLightbox(image)}
              >
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white font-medium">{image.caption}</p>
                  <p className="text-white/80 text-xs">Source: {image.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation buttons */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
          onClick={prevImage}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md"
          onClick={nextImage}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Thumbnails */}
      <div className="mt-4 flex justify-center space-x-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeImageIndex ? "bg-primary w-4" : "bg-gray-300"
            }`}
            onClick={() => setActiveImageIndex(index)}
          ></button>
        ))}
      </div>
      
      {/* Image info */}
      <div className="mt-4 text-center">
        <h3 className="text-sm font-medium text-gray-900">
          {images[activeImageIndex].caption}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {images[activeImageIndex].source}
        </p>
      </div>
      
      {/* Search button */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchImages(["dragon", "forest", "castle"][Math.floor(Math.random() * 3)])}
          className="text-xs"
        >
          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Images
        </Button>
      </div>
      
      {/* Lightbox */}
      {showLightbox && lightboxImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={closeLightbox}>
          <div className="relative max-w-4xl max-h-screen bg-white rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 z-10"
              onClick={closeLightbox}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.caption}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
            <div className="p-4 bg-white">
              <h3 className="text-lg font-medium text-gray-900">{lightboxImage.caption}</h3>
              <p className="text-sm text-gray-500 mt-1">Source: {lightboxImage.source}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}