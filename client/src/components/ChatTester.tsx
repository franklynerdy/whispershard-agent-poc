import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatTester() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = { role: "user" as const, content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      // Send to API
      const response = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          stream: false, // For simplicity in this demo, we won't use streaming
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error from API: ${response.statusText}`);
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: `Failed to get response: ${(error as Error).message}`,
        variant: "destructive",
      });
      
      // Add fallback message
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, there was an error processing your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="mt-8 bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Chat Test Interface</h2>
        <div className="mt-5">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message, index) => (
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
                          {message.role === "user" ? "User" : "WhisperShard AI"}
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
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
                    placeholder="Type your message..."
                    disabled={isLoading}
                  />
                  <div className="py-2 px-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button" 
                        className="inline-flex items-center justify-center rounded text-gray-500 hover:text-gray-700"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm ml-1">Options</span>
                      </button>
                    </div>
                    <div className="flex-shrink-0">
                      <Button 
                        type="submit"
                        disabled={isLoading || !inputValue.trim()} 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {isLoading ? "Sending..." : "Send"}
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
