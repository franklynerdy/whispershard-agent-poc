import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type RuleResponse = {
  question: string;
  explanation: string;
  sourceName?: string;
  sourceText?: string;
  bulletPoints: string[];
};

export default function RuleTab() {
  const [ruleQuestion, setRuleQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ruleResponse, setRuleResponse] = useState<RuleResponse | null>(null);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ruleQuestion.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Mock API call for now - will connect to real API later
      // const response = await fetch(`/api/rule?q=${encodeURIComponent(ruleQuestion)}`);
      
      // For demonstration purposes, we'll mock a response
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
      
      // Mock different responses based on the query
      let mockResponse: RuleResponse;
      
      if (ruleQuestion.toLowerCase().includes("combat")) {
        mockResponse = {
          question: ruleQuestion,
          explanation: "Combat in WhisperShard follows a turn-based initiative system where participants act in order of their initiative roll (d20 + Dexterity modifier).",
          sourceName: "Core Rulebook: Combat",
          sourceText: "Initiative determines the order of turns during combat. At the start of a combat, each combatant makes a Dexterity check to determine their place in the initiative order.",
          bulletPoints: [
            "Roll initiative: d20 + Dexterity modifier",
            "Combat proceeds in initiative order, highest to lowest",
            "On your turn, you can move and take one action",
            "Attacks are d20 + modifiers vs target's Armor Class",
            "Critical hits occur on natural 20 and deal double damage dice"
          ]
        };
      } else if (ruleQuestion.toLowerCase().includes("magic") || ruleQuestion.toLowerCase().includes("spell")) {
        mockResponse = {
          question: ruleQuestion,
          explanation: "Magic in WhisperShard is divided into arcane, divine, and primal sources. Spellcasting requires a focus or component pouch and typically involves a verbal, somatic, or material component.",
          sourceName: "Core Rulebook: Spellcasting",
          sourceText: "To cast a spell, a character must be able to speak (if the spell has a verbal component), gesture (if it has a somatic component), and sometimes employ various physical components.",
          bulletPoints: [
            "Spell slots are expended when casting spells of 1st level or higher",
            "Cantrips can be cast at will without expending slots",
            "Concentration spells end when you cast another concentration spell",
            "Saving throws for spells use DC = 8 + proficiency + spellcasting ability",
            "Some spells can be cast as rituals, taking 10 minutes longer but not expending a slot"
          ]
        };
      } else {
        mockResponse = {
          question: ruleQuestion,
          explanation: "Rules for this topic will be integrated in the next update. For now, consult your Game Master for rulings on this matter.",
          bulletPoints: [
            "Rule details will be added in future updates",
            "Check back soon for more complete rules information",
            "Your Game Master is the final arbiter of rules"
          ]
        };
      }
      
      setRuleResponse(mockResponse);
      
    } catch (error) {
      console.error("Error fetching rule:", error);
      toast({
        title: "Error",
        description: "Failed to retrieve rule information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Rule Interpreter</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ask questions about game rules and receive detailed explanations with source references.
        </p>
        
        <form onSubmit={handleSubmit} className="mt-5 flex space-x-3">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Ask a rule question... (e.g., 'How does combat work?')"
              value={ruleQuestion}
              onChange={(e) => setRuleQuestion(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !ruleQuestion.trim()}
            className="inline-flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : "Lookup Rule"}
          </Button>
        </form>
        
        {ruleResponse && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-md font-medium text-gray-900">
              {ruleResponse.question}
            </h3>
            
            <p className="mt-2 text-sm text-gray-600">{ruleResponse.explanation}</p>
            
            {ruleResponse.sourceName && (
              <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-100">
                <span className="text-xs font-medium text-blue-800">Source: {ruleResponse.sourceName}</span>
                {ruleResponse.sourceText && (
                  <p className="mt-1 text-sm text-blue-700 italic">"{ruleResponse.sourceText}"</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Key Points:</h4>
              <ul className="mt-2 pl-5 list-disc space-y-2">
                {ruleResponse.bulletPoints.map((point, index) => (
                  <li key={index} className="text-sm text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}