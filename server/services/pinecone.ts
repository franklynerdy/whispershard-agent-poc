import { Pinecone } from '@pinecone-database/pinecone';

// Singleton Pinecone client
let pineconeClient: Pinecone | null = null;

// Initialize the Pinecone client
export async function initPinecone() {
  try {
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;

    if (!apiKey) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }

    if (!environment) {
      throw new Error("PINECONE_ENVIRONMENT environment variable is not set");
    }

    console.log("Initializing Pinecone connection...");

    // Create Pinecone client instance
    pineconeClient = new Pinecone({
      apiKey,
    });

    console.log("Pinecone connection established");
    return pineconeClient;
  } catch (error) {
    console.error("Pinecone initialization error:", error);
    throw error;
  }
}

// Get Pinecone client
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    throw new Error("Pinecone client not initialized");
  }
  return pineconeClient;
}

// Check if an index exists
export async function checkIndexExists(indexName: string): Promise<boolean> {
  try {
    const client = getPineconeClient();
    const indexes = await client.listIndexes();
    return indexes.indexes?.some(index => index.name === indexName) || false;
  } catch (error) {
    console.error(`Error checking if index ${indexName} exists:`, error);
    return false;
  }
}

// Create a new vector embedding and store it in Pinecone
export async function storeEmbedding(
  indexName: string,
  id: string,
  vector: number[],
  metadata: Record<string, any>
) {
  try {
    const client = getPineconeClient();
    const index = client.Index(indexName);
    
    await index.upsert([{
      id,
      values: vector,
      metadata
    }]);
    
    return { success: true };
  } catch (error) {
    console.error("Error storing embedding:", error);
    throw error;
  }
}

// Query for similar vectors
export async function querySimilarVectors(
  indexName: string,
  vector: number[],
  topK: number = 5,
  filter?: Record<string, any>
) {
  try {
    const client = getPineconeClient();
    const index = client.Index(indexName);
    
    const queryResponse = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter
    });
    
    return queryResponse.matches || [];
  } catch (error) {
    console.error("Error querying similar vectors:", error);
    throw error;
  }
}

// Delete a vector by ID
export async function deleteVector(indexName: string, id: string) {
  try {
    const client = getPineconeClient();
    const index = client.Index(indexName);
    
    await index.deleteOne(id);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting vector:", error);
    throw error;
  }
}