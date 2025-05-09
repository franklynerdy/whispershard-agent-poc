import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ApiEndpoints() {
  const { toast } = useToast();
  const [statusResponse, setStatusResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testStatusEndpoint = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/status");
      const data = await response.json();
      setStatusResponse(JSON.stringify(data, null, 2));
      
      toast({
        title: "Status API Test",
        description: "Successfully retrieved status",
        variant: "default",
      });
    } catch (error) {
      setStatusResponse(`Error: ${(error as Error).message}`);
      
      toast({
        title: "Status API Test Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">API Endpoints</h2>
        <div className="mt-5 space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="px-2 py-1 mr-3 text-xs font-medium rounded-md text-white bg-green-600">GET</span>
                <h3 className="text-md font-medium text-gray-900">/api/status</h3>
              </div>
              <Button
                onClick={testStatusEndpoint}
                disabled={isLoading}
                className="px-3 py-1 text-sm font-medium rounded-md text-primary hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                variant="outline"
              >
                {isLoading ? "Testing..." : "Test"}
              </Button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">Health check endpoint. Returns MongoDB connection status and basic system information.</p>
            </div>
            <div className="mt-4 bg-white border border-gray-200 rounded-md">
              <div className="px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Response Example</h4>
              </div>
              <div className="p-4">
                <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                  {statusResponse || `{
  "status": "ok",
  "mongodb": "connected",
  "database": "whispershard",
  "version": "1.0.0"
}`}
                </pre>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="px-2 py-1 mr-3 text-xs font-medium rounded-md text-white bg-blue-600">POST</span>
                <h3 className="text-md font-medium text-gray-900">/chat</h3>
              </div>
              <Button
                className="px-3 py-1 text-sm font-medium rounded-md text-primary hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Chat API Test",
                    description: "Please use the Chat Test Interface below to test the chat API",
                    variant: "default",
                  });
                }}
              >
                Test
              </Button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Chat API endpoint with streaming capability. Handles conversation and performs script/scene lookup.
              </p>
            </div>
            <div className="mt-4 bg-white border border-gray-200 rounded-md">
              <div className="px-4 py-2 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Request Example</h4>
              </div>
              <div className="p-4">
                <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
{`{
  "messages": [
    { "role": "user", "content": "Tell me about the garden scene" }
  ],
  "stream": true
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
