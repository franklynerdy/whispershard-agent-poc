import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let database: Db | null = null;

// Initialize MongoDB connection
export async function initMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || "whispershard";

    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    client = new MongoClient(uri);
    await client.connect();
    
    database = client.db(dbName);
    
    console.log(`Connected to MongoDB database: ${dbName}`);
    
    // Initialize collections if they don't exist
    await initializeCollections();

    return { client, database };
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Get MongoDB client instance
export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error("MongoDB client not initialized");
  }
  return client;
}

// Get MongoDB database instance
export function getMongoDatabase(): Db {
  if (!database) {
    throw new Error("MongoDB database not initialized");
  }
  return database;
}

// Initialize collections
async function initializeCollections() {
  if (!database) {
    throw new Error("MongoDB database not initialized");
  }

  // Check if scripts collection exists, if not create it
  const collections = await database.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  if (!collectionNames.includes("scripts")) {
    await database.createCollection("scripts");
    console.log("Created scripts collection");
    
    // Add sample script if collection is empty
    const count = await database.collection("scripts").countDocuments();
    if (count === 0) {
      await database.collection("scripts").insertOne({
        title: "Sample Script",
        description: "This is a sample script for testing purposes",
        content: "INT. SAMPLE SCENE - DAY\n\nCharacter walks into the room and looks around.\n\nCHARACTER\nHello, is anyone here?",
        scene_descriptions: ["INT. SAMPLE SCENE - DAY", "Character walks into the room"]
      });
      console.log("Added sample script to database");
    }
  }
}
