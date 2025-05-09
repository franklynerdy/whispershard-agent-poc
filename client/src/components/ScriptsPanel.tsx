import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ScriptSuggestion = {
  id: string;
  title: string;
  content: string;
  type: "combat" | "roleplay" | "ambient";
};

type ScriptsPanelProps = {
  onSelectScript?: (content: string) => void;
  searchTerm?: string;
};

export default function ScriptsPanel({ onSelectScript, searchTerm }: ScriptsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ScriptSuggestion[]>([]);
  const [showPanel, setShowPanel] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    if (searchTerm) {
      fetchSuggestions(searchTerm);
    }
  }, [searchTerm]);
  
  const fetchSuggestions = async (term: string) => {
    setIsLoading(true);
    
    try {
      // Mock API call - will replace with actual endpoint
      // const response = await fetch(`/api/script-suggestions?term=${encodeURIComponent(term)}`);
      
      // For demonstration, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Generate mock response based on the term
      const isCombat = term.toLowerCase().includes("combat");
      const isRoleplay = term.toLowerCase().includes("roleplay");
      
      let mockSuggestions: ScriptSuggestion[] = [];
      
      if (isCombat) {
        mockSuggestions = [
          {
            id: "c1",
            title: "Goblin Ambush",
            content: "Three goblins leap from behind the rocks, their crude weapons glinting in the moonlight. Roll for initiative! The lead goblin snarls, 'Give us your gold or your lives!'",
            type: "combat"
          },
          {
            id: "c2",
            title: "Bar Brawl",
            content: "The tavern erupts into chaos as the drunk mercenary throws the first punch. Tables are overturned, bottles shatter, and you find yourself in the middle of an all-out brawl.",
            type: "combat"
          },
          {
            id: "c3",
            title: "Guardian Construct",
            content: "With a grinding of gears and a hiss of steam, the ancient stone construct awakens. Its eyes glow an eerie blue as it raises its massive fists. 'INTRUDERS DETECTED. ELIMINATION PROTOCOL ENGAGED.'",
            type: "combat"
          }
        ];
      } else if (isRoleplay) {
        mockSuggestions = [
          {
            id: "r1",
            title: "Mysterious Merchant",
            content: "A hooded figure approaches your camp as night falls. 'Travelers, I bring wares from distant lands. Perhaps you'd be interested in something... extraordinary?' The merchant opens their cloak to reveal artifacts that seem to shimmer with magical energy.",
            type: "roleplay"
          },
          {
            id: "r2",
            title: "Noble's Request",
            content: "Lady Evelyn Blackwood adjusts her fine silk gloves and regards you with calculating eyes. 'I've heard of your... talents. I have a task requiring discretion. The reward will be substantial, but you mustn't ask too many questions.'",
            type: "roleplay"
          },
          {
            id: "r3",
            title: "Village Elder's Plea",
            content: "The elderly halfling wrings his weathered hands, voice trembling. 'Our children have been disappearing for weeks now. The mayor does nothing. You're outsiders, maybe you can help where others have failed? We have little to offer but our gratitude.'",
            type: "roleplay"
          }
        ];
      } else {
        mockSuggestions = [
          {
            id: "a1",
            title: "Forest Ambience",
            content: "The ancient forest breathes around you. Dappled sunlight filters through the emerald canopy, illuminating dancing motes of dust. Somewhere in the distance, birds call to one another in melodious conversation.",
            type: "ambient"
          },
          {
            id: "a2",
            title: "City Market",
            content: "The marketplace bustles with activity. Merchants hawk their wares in a cacophony of competing voices. The aroma of exotic spices, fresh bread, and questionable street food fills the air, while pickpockets eye the crowd for easy targets.",
            type: "ambient"
          },
          {
            id: "a3",
            title: "Forgotten Ruins",
            content: "Cold stone walls rise around you, covered in creeping vines and ancient, faded carvings. Water drips somewhere in the darkness, and the air hangs heavy with the scent of damp earth and decay. The silence feels expectant, as if the ruins themselves are holding their breath.",
            type: "ambient"
          }
        ];
      }
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error("Error fetching script suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve script suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleScriptSelect = (content: string) => {
    if (onSelectScript) {
      onSelectScript(content);
    }
    
    toast({
      title: "Script Selected",
      description: "The script has been added to your input.",
      variant: "default",
    });
  };
  
  if (!showPanel) {
    return (
      <div className="mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowPanel(true)}
          className="w-full text-xs"
        >
          Show Script Suggestions
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mt-4 bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Script Suggestions</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No script suggestions available.</p>
            <p className="text-sm mt-2">Try mentioning "combat" or "roleplay" in your message.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="script-suggestion rounded-md"
                onClick={() => handleScriptSelect(suggestion.content)}
              >
                <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{suggestion.content}</p>
                <div className="mt-1 flex justify-end">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    suggestion.type === 'combat' 
                      ? 'bg-red-100 text-red-800' 
                      : suggestion.type === 'roleplay'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {suggestion.type}
                  </span>
                </div>
              </div>
            ))}
            
            <div className="mt-4 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSuggestions(Math.random() > 0.5 ? "combat" : "roleplay")}
                className="text-xs"
              >
                ↻ Refresh Suggestions
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}