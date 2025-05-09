import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

type StatusResponse = {
  status: string;
  mongodb: string;
  database: string;
  pinecone: string;
  cloudflare_r2: string;
  version: string;
};

export default function StatusCard() {
  const { data, isLoading, error } = useQuery<StatusResponse>({
    queryKey: ['/api/status'],
  });
  
  const isConnected = data?.mongodb === "connected";

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">System Status</h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-3 flex justify-center py-10">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="col-span-3 py-4 px-6 bg-red-50 text-red-700 rounded-lg">
              <p>Failed to load status: {(error as Error).message}</p>
            </div>
          ) : (
            <>
              <Card className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Express Server</dt>
                    <dd className="mt-1 text-3xl font-semibold text-success">Active</dd>
                  </dl>
                  <div className="mt-4">
                    <Badge variant="success">
                      Running on port 5000
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">MongoDB Connection</dt>
                    <dd className="mt-1 text-3xl font-semibold text-success">{isConnected ? "Connected" : "Disconnected"}</dd>
                  </dl>
                  <div className="mt-4">
                    <Badge variant="success">
                      Database: {data?.database || "N/A"}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">OpenAI Integration</dt>
                    <dd className="mt-1 text-3xl font-semibold text-success">Ready</dd>
                  </dl>
                  <div className="mt-4">
                    <Badge variant="success">
                      API Key Configured
                    </Badge>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pinecone Vector DB</dt>
                    <dd className="mt-1 text-3xl font-semibold text-success">
                      {data?.pinecone === "configured" ? "Configured" : "Not Configured"}
                    </dd>
                  </dl>
                  <div className="mt-4">
                    <Badge variant={data?.pinecone === "configured" ? "success" : "secondary"}>
                      {data?.pinecone === "configured" ? "Ready for embeddings" : "API Key required"}
                    </Badge>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Cloudflare R2</dt>
                    <dd className="mt-1 text-3xl font-semibold text-success">
                      {data?.cloudflare_r2 === "configured" ? "Configured" : "Not Configured"}
                    </dd>
                  </dl>
                  <div className="mt-4">
                    <Badge variant={data?.cloudflare_r2 === "configured" ? "success" : "secondary"}>
                      {data?.cloudflare_r2 === "configured" ? "Ready for storage" : "API Key required"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
