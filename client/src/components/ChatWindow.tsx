import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "script"; // Adding type field for script narration cards
  scene?: string;
  script?: string;
};

type ChatMode = "narrate" | "interpret";
type SceneBanner = null | {
  name: string;
  summary: string;
};

type ChatWindowProps = {
  setImageSearchTerm?: (term: string) => void;
};

export default function ChatWindow({ setImageSearchTerm }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("narrate");
  const [sceneBanner, setSceneBanner] = useState<SceneBanner>(null);
  const [scriptSuggestions, setScriptSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const narrationCardRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to the most recent narration card when it appears
  useEffect(() => {
    if (narrationCardRef.current) {
      narrationCardRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      scrollToBottom();
    }
  }, [messages]);
  
  // Check for script suggestions and image search terms
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      const content = lastMessage.content.toLowerCase();
      
      // Check for script suggestions
      if (content.includes("combat") || content.includes("roleplay")) {
        fetchScriptSuggestions(content.includes("combat") ? "combat" : "roleplay");
      }
      
      // Check for image search terms
      if (setImageSearchTerm) {
        const imageKeywords = [
          "dragon", "monster", "forest", "castle", "dungeon", 
          "sword", "shield", "armor", "weapon", "map", "treasure"
        ];
        
        const foundKeyword = imageKeywords.find(keyword => content.includes(keyword));
        if (foundKeyword) {
          setImageSearchTerm(foundKeyword);
        }
      }
    }
  }, [messages, setImageSearchTerm]);
  
  const fetchScriptSuggestions = async (type: "combat" | "roleplay") => {
    try {
      // This will be replaced with actual API call when endpoint is ready
      // Mocking for now
      console.log(`Fetching ${type} suggestions...`);
      
      // Mock suggestions based on type
      if (type === "combat") {
        setScriptSuggestions([
          "The goblin lunges with its rusty dagger! Roll for initiative...",
          "A band of orcs appears from behind the rocky outcrop, weapons drawn.",
          "The dragon's scales glisten in the torchlight as it awakens from its slumber."
        ]);
      } else {
        setScriptSuggestions([
          "Elara the elven merchant offers you a mysterious potion at half price.",
          "Lord Devereux insists you stay for dinner, though his smile never reaches his eyes.",
          "The old beggar reveals himself as a disguised mage seeking an apprentice."
        ]);
      }
      
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching script suggestions:", error);
    }
  };
  
  const toggleChatMode = () => {
    setChatMode(prev => prev === "narrate" ? "interpret" : "narrate");
    toast({
      title: `Mode changed to ${chatMode === "narrate" ? "Interpret Rules" : "Narrate Scene"}`,
      description: `The agent will now ${chatMode === "narrate" ? "help interpret game rules" : "narrate scenes and stories"}`,
      variant: "default",
    });
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = { role: "user" as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    // Hide suggestions after submitting
    setShowSuggestions(false);
    
    try {
      // Use EventSource for SSE streaming
      const eventSource = new EventSource(`/chat?query=${encodeURIComponent(inputValue)}&mode=${chatMode}`);
      
      let accumulatedContent = "";
      let messageStarted = false;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.done) {
            eventSource.close();
            setIsLoading(false);
            return;
          }
          
          // Handle scene detection (mock for now)
          if (data.scene) {
            setSceneBanner({
              name: data.scene.name,
              summary: data.scene.summary
            });
          }
          
          // Handle script type messages
          if (data.type === "script") {
            setMessages(prev => [...prev, {
              role: "assistant",
              content: data.content || "",
              type: "script",
              scene: data.scene,
              script: data.script
            }]);
            return;
          }
          
          // Handle regular content
          if (data.content) {
            if (!messageStarted) {
              messageStarted = true;
              setMessages(prev => [...prev, {
                role: "assistant",
                content: data.content
              }]);
            } else {
              accumulatedContent += data.content;
              setMessages(prev => {
                const lastMessage = { ...prev[prev.length - 1] };
                lastMessage.content += data.content;
                return [...prev.slice(0, -1), lastMessage];
              });
            }
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        eventSource.close();
        setIsLoading(false);
        
        toast({
          title: "Connection Error",
          description: "The connection to the server was lost. Please try again.",
          variant: "destructive",
        });
      };
      
      // Fallback to non-streaming if SSE fails
    } catch (error) {
      console.error("Chat error:", error);
      
      // Regular fetch fallback
      try {
        const response = await fetch("/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            stream: false,
            mode: chatMode
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error from API: ${response.statusText}`);
        }
        
        const data = await response.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } catch (innerError) {
        console.error("Fallback chat error:", innerError);
        toast({
          title: "Error",
          description: `Failed to get response: ${(innerError as Error).message}`,
          variant: "destructive",
        });
        
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "I'm sorry, there was an error processing your request. Please try again." 
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Chat Header with Mode Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            WhisperShard Chat
            <Badge 
              variant={chatMode === "narrate" ? "default" : "secondary"} 
              className="ml-2"
            >
              {chatMode === "narrate" ? "Narrate Scene" : "Interpret Rules"}
            </Badge>
          </h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Narrate</span>
            <Switch 
              checked={chatMode === "interpret"} 
              onCheckedChange={toggleChatMode} 
            />
            <span className="text-sm text-gray-500">Interpret</span>
          </div>
        </div>
        
        {/* Scene Banner */}
        {sceneBanner && (
          <div className="mode-banner mt-4">
            <span className="font-semibold">Scene found:</span> {sceneBanner.name} – {sceneBanner.summary}
          </div>
        )}
        
        <div className="mt-5">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Chat Messages */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No messages yet. Start a conversation! Try asking about a scene or rule.</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  // For script-type messages, render special narration card
                  if (message.role === "assistant" && message.type === "script") {
                    return (
                      <div 
                        key={index} 
                        className="narration-card"
                        ref={index === messages.length - 1 ? narrationCardRef : null}
                      >
                        {message.script || message.content}
                      </div>
                    );
                  }
                  
                  // Regular messages
                  return (
                    <div 
                      key={index} 
                      className={`flex flex-col ${
                        message.role === "user" 
                          ? "bg-white rounded-lg border border-gray-200" 
                          : "bg-indigo-50 rounded-lg border border-indigo-100"
                      } p-3 shadow-sm`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {message.role === "user" ? (
                            <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          ) : (
                            <svg className="h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {message.role === "user" ? "You" : "WhisperShard AI"}
                          </div>
                          <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                            {message.content.split("\n").map((line, i) => (
                              <p key={i} className={i > 0 ? "mt-2" : ""}>
                                {line}
                              </p>
                            ))}
                            
                            {message.role === "assistant" && 
                              message.content.includes("Reference:") && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                                {message.content
                                  .split("\n")
                                  .filter(line => line.includes("Reference:") || line.includes("Timestamp:"))
                                  .map((line, i) => <p key={i}>{line}</p>)
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Script Suggestions */}
            {showSuggestions && scriptSuggestions.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Script Suggestions</h3>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Hide
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {scriptSuggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="script-suggestion"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chat Input */}
            <div className="mt-4">
              <form className="relative" onSubmit={handleSubmit}>
                <div className="border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <Textarea 
                    rows={3} 
                    name="message" 
                    id="message" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="block w-full py-3 px-4 border-0 resize-none focus:ring-0 sm:text-sm" 
                    placeholder={`Type your message... (${chatMode === "narrate" ? "describe a scene or ask for a narration" : "ask about game rules"})`}
                    disabled={isLoading}
                  />
                  <div className="py-2 px-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button" 
                        className="inline-flex items-center justify-center rounded text-gray-500 hover:text-gray-700"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-sm ml-1">Suggestions</span>
                      </button>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        type="submit"
                        disabled={isLoading || !inputValue.trim()} 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Thinking...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}