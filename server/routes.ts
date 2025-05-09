import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MongoClient } from "mongodb";
import { openaiChat } from "./services/openai";
import { getMongoClient, getMongoDatabase } from "./services/mongodb";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Status endpoint
  app.get("/api/status", async (_req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = getMongoDatabase();

      // Check if we have connection to MongoDB
      let isConnected = false;
      try {
        // Simple ping to check connection
        await client.db().command({ ping: 1 });
        isConnected = true;
      } catch (e) {
        console.error("MongoDB connection check failed:", e);
        isConnected = false;
      }
      
      res.json({
        status: "ok",
        mongodb: isConnected ? "connected" : "disconnected",
        database: process.env.DB_NAME || "whispershard",
        version: "1.0.0"
      });
    } catch (error) {
      console.error("Status endpoint error:", error);
      res.status(500).json({ 
        status: "error", 
        message: (error as Error).message,
        mongodb: "disconnected" 
      });
    }
  });

  // Chat endpoint
  app.post("/chat", async (req: Request, res: Response) => {
    try {
      const { messages, stream = false } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages format" });
      }
      
      // Get the latest user message
      const userMessage = messages[messages.length - 1];
      
      if (userMessage.role !== "user") {
        return res.status(400).json({ error: "Last message must be from user" });
      }
      
      // Look up script information from MongoDB if query mentions scripts or scenes
      const db = getMongoDatabase();
      const scripts = db.collection("scripts");
      
      // Check if the user's message contains keywords related to scripts or scenes
      const query = userMessage.content.toLowerCase();
      let scriptContext = "";
      
      if (query.includes("script") || query.includes("scene")) {
        // Extract potential keywords from the user's message
        const keywords = query
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((word: string) => word.length > 3);
        
        if (keywords.length > 0) {
          const scriptResults = await scripts.find({
            $or: [
              { title: { $regex: keywords.join("|"), $options: "i" } },
              { content: { $regex: keywords.join("|"), $options: "i" } },
              { scene_descriptions: { $regex: keywords.join("|"), $options: "i" } }
            ]
          }).limit(3).toArray();
          
          if (scriptResults.length > 0) {
            scriptContext = "Relevant script information:\n";
            scriptResults.forEach(script => {
              scriptContext += `Title: ${script.title}\n`;
              scriptContext += `Description: ${script.description || "N/A"}\n`;
              scriptContext += `Content: ${script.content.substring(0, 300)}...\n\n`;
            });
          }
        }
      }
      
      // If streaming is requested
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        try {
          const stream = await openaiChat(messages, scriptContext, true);
          
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
          
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          res.end();
        } catch (error) {
          console.error("Streaming error:", error);
          res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
          res.end();
        }
      } else {
        // Non-streaming response
        const completion = await openaiChat(messages, scriptContext, false);
        const response = completion.choices[0]?.message.content || "No response generated";
        
        res.json({ response });
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
