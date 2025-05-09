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
      const { messages, stream = false, mode = "narrate" } = req.body;
      
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
      let detectedScene = null;
      
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
            
            // Use the first result as the detected scene
            detectedScene = {
              name: scriptResults[0].title,
              summary: scriptResults[0].description || "A descriptive scene"
            };
            
            scriptResults.forEach(script => {
              scriptContext += `Title: ${script.title}\n`;
              scriptContext += `Description: ${script.description || "N/A"}\n`;
              scriptContext += `Content: ${script.content.substring(0, 300)}...\n\n`;
            });
          }
        }
      }
      
      // Handle streaming SSE response
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        try {
          // Send scene info if detected
          if (detectedScene) {
            res.write(`data: ${JSON.stringify({ scene: detectedScene })}\n\n`);
          }
          
          const streamResponse = await openaiChat(messages, scriptContext, true, mode);
          
          // We need to ensure we're working with a stream
          if (!streamResponse || typeof streamResponse[Symbol.asyncIterator] !== 'function') {
            console.error("Expected stream response but got regular response");
            res.write(`data: ${JSON.stringify({ error: "Stream response expected but not received" })}\n\n`);
            res.end();
            return;
          }
          
          let buffer = "";
          let inNarrationBlock = false;
          let narrationContent = "";
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              buffer += content;
              
              // Check for narration tags
              if (buffer.includes("[NARRATION]") && !inNarrationBlock) {
                const parts = buffer.split("[NARRATION]");
                
                // Send any text before the narration tag
                if (parts[0].trim()) {
                  res.write(`data: ${JSON.stringify({ content: parts[0] })}\n\n`);
                }
                
                buffer = parts[1] || "";
                inNarrationBlock = true;
                narrationContent = "";
              }
              
              if (inNarrationBlock && buffer.includes("[/NARRATION]")) {
                const parts = buffer.split("[/NARRATION]");
                narrationContent += parts[0];
                
                // Send the narration as a script type message
                res.write(`data: ${JSON.stringify({ 
                  type: "script", 
                  script: narrationContent.trim(),
                  scene: detectedScene?.name || "Narration"
                })}\n\n`);
                
                buffer = parts[1] || "";
                inNarrationBlock = false;
              } else if (inNarrationBlock) {
                narrationContent += content;
              } else {
                // Regular content
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
          }
          
          // Handle any remaining buffer
          if (buffer.trim()) {
            res.write(`data: ${JSON.stringify({ content: buffer })}\n\n`);
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
        const completion = await openaiChat(messages, scriptContext, false, mode);
        // Check if we have a ChatCompletion object (not a stream)
        let response = "No response generated";
        
        // Properly handle the response format
        if (completion && 'choices' in completion && completion.choices && completion.choices[0]?.message) {
          response = completion.choices[0].message.content || "No response generated";
        }
        
        // Check for narration tags in non-streaming response
        if (response.includes("[NARRATION]") && response.includes("[/NARRATION]")) {
          const narrationMatch = response.match(/\[NARRATION\]([\s\S]*?)\[\/NARRATION\]/);
          
          if (narrationMatch && narrationMatch[1]) {
            // Extract narration content
            const narrationContent = narrationMatch[1].trim();
            
            // Replace the narration block in the original response
            response = response.replace(/\[NARRATION\]([\s\S]*?)\[\/NARRATION\]/, "");
            
            // Return both the regular response and the narration
            return res.json({ 
              response: response.trim(), 
              narration: narrationContent,
              scene: detectedScene
            });
          }
        }
        
        // If no narration tags, return regular response
        res.json({ response, scene: detectedScene });
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Rule lookup endpoint
  app.get("/api/rule", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const query = q.toString().toLowerCase();
      const db = getMongoDatabase();
      
      // This would normally query a rules collection
      // For now, return a mock response
      const mockRule = {
        question: query,
        explanation: `Rules for ${query} are determined by the game master and the rulebook.`,
        bulletPoints: [
          "Check the core rulebook for basic rules",
          "Consult your GM for house rules",
          "Remember the Rule of Cool: if it's awesome, it might be allowed"
        ]
      };
      
      res.json(mockRule);
    } catch (error) {
      console.error("Rule lookup error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Script suggestions endpoint
  app.get("/api/script-suggestions", async (req: Request, res: Response) => {
    try {
      const { term } = req.query;
      
      if (!term) {
        return res.status(400).json({ error: "Query parameter 'term' is required" });
      }
      
      const query = term.toString().toLowerCase();
      const db = getMongoDatabase();
      
      // This would normally query for script suggestions
      // For now, return mock suggestions
      let suggestions = [];
      
      if (query.includes("combat")) {
        suggestions = [
          {
            id: "c1",
            title: "Goblin Ambush",
            content: "Three goblins leap from behind the rocks, their crude weapons glinting in the moonlight. Roll for initiative!",
            type: "combat"
          },
          {
            id: "c2",
            title: "Dragon's Lair",
            content: "The ancient red dragon unfurls its massive wings, sending gusts of hot air throughout the cavern. Its eyes lock onto yours.",
            type: "combat"
          }
        ];
      } else {
        suggestions = [
          {
            id: "r1",
            title: "Tavern Scene",
            content: "The Prancing Pony is bustling with activity. A bard plays in the corner while patrons share tales of adventure.",
            type: "roleplay"
          },
          {
            id: "r2",
            title: "Royal Court",
            content: "The queen sits upon her throne, eyeing you suspiciously. Guards flank her on both sides, hands resting on their hilts.",
            type: "roleplay"
          }
        ];
      }
      
      res.json({ suggestions });
    } catch (error) {
      console.error("Script suggestions error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Image search endpoint
  app.get("/api/search-images", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const query = q.toString().toLowerCase();
      const db = getMongoDatabase();
      
      // This would normally query for images
      // For now, return mock images
      const mockImages = [
        {
          id: "img1",
          assetId: query + "_1",
          url: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&auto=format&fit=crop",
          caption: query.charAt(0).toUpperCase() + query.slice(1) + " - View 1",
          source: "WhisperShard Assets"
        },
        {
          id: "img2",
          assetId: query + "_2",
          url: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=600&auto=format&fit=crop",
          caption: query.charAt(0).toUpperCase() + query.slice(1) + " - View 2",
          source: "WhisperShard Assets"
        }
      ];
      
      res.json({ images: mockImages });
    } catch (error) {
      console.error("Image search error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
