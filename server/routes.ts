import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MongoClient } from "mongodb";
import { openaiChat } from "./services/openai";
import { getMongoClient, getMongoDatabase } from "./services/mongodb";
import { listObjects } from "./services/cloudflare";
import { findAssetById, findImagesForAsset, searchAssets, searchRuleFragments, findScriptSuggestions } from "./services/assetService";
import { 
  findAssetById as findUnifiedAsset,
  searchUnifiedAssets,
  findRuleFragments as findUnifiedRuleFragments,
  saveUnifiedAsset
} from "./services/unifiedAssetService";

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
        pinecone: process.env.PINECONE_API_KEY ? "configured" : "not configured",
        cloudflare_r2: process.env.CLOUDFLARE_R2_ACCESS_KEY ? "configured" : "not configured",
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
  
  // Route for testing the unified schema
  app.get("/api/unified-schema-test", async (_req: Request, res: Response) => {
    try {
      // Import the unified schema
      const { 
        UnifiedAssetSchema, 
        SpellSchema, 
        AssetCategory,
        FlexibleAssetSchema,
        convertToUnifiedAsset
      } = await import('./services/unifiedSchema');
      
      // Create a test spell asset using the polymorphic schema
      const testSpell = SpellSchema.parse({
        id: "magic_missile",
        name: "Magic Missile",
        assetCategory: AssetCategory.SPELL,
        schemaVersion: "2.4",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: {
          verbal: true,
          somatic: true
        },
        duration: "Instantaneous",
        description: "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range."
      });
      
      // Create a flexible asset using the general schema
      const flexibleAsset = FlexibleAssetSchema.parse({
        id: "flexible_test_asset",
        name: "Flexible Test Asset",
        description: "This asset was created using the flexible schema",
        tags: ["test", "flexible", "v2.4"],
        narrative_function: "demonstration",
        // Adding a non-standard field to demonstrate flexibility
        custom_field: "This field isn't part of any standard schema"
      });
      
      // Convert flexible asset to unified format
      const convertedAsset = convertToUnifiedAsset(flexibleAsset);
      
      res.json({
        message: "Unified schema test successful",
        testSpell,
        flexibleAsset,
        convertedAsset
      });
    } catch (error) {
      console.error('Error testing unified schema:', error);
      res.status(500).json({ 
        status: "error", 
        message: "Error testing unified schema",
        error: error instanceof Error ? error.message : String(error)
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
      
      // Try to find rule fragments from MongoDB using the schema
      const ruleFragments = await searchRuleFragments(query);
      
      if (ruleFragments && ruleFragments.length > 0) {
        // Use the first rule fragment as the main explanation
        const mainRule = ruleFragments[0];
        
        // Extract bullet points from additional rule fragments
        const bulletPoints = ruleFragments.slice(1).map(rule => {
          if (typeof rule.text === 'string') {
            return rule.text.substring(0, 100) + (rule.text.length > 100 ? '...' : '');
          }
          return rule.description?.toString().substring(0, 100) || 'Related rule';
        });
        
        // Add default bullet points if we don't have enough
        if (bulletPoints.length < 2) {
          bulletPoints.push("Consult your GM for specific interpretations");
          bulletPoints.push("Remember the Rule of Cool: if it's awesome, it might be allowed");
        }
        
        // Format the response
        const ruleResponse = {
          question: query,
          explanation: mainRule.text?.toString() || mainRule.description?.toString() || `Rules about ${query}`,
          sourceName: mainRule.sourceBook?.toString() || mainRule.source?.toString(),
          sourceText: mainRule.section?.toString() || 'Core Rules',
          bulletPoints
        };
        
        return res.json(ruleResponse);
      }
      
      // If no rule fragments found, create a generic response
      const defaultRule = {
        question: query,
        explanation: `Rules for ${query} are determined by the game master and the rulebook.`,
        bulletPoints: [
          "Check the core rulebook for basic rules",
          "Consult your GM for house rules",
          "Remember the Rule of Cool: if it's awesome, it might be allowed"
        ]
      };
      
      res.json(defaultRule);
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
      
      // First try to find images in MongoDB using the schema
      try {
        console.log(`Searching for asset images with ID: ${query}`);
        const dbImages = await findImagesForAsset(query);
        
        if (dbImages && dbImages.length > 0) {
          console.log(`Found ${dbImages.length} images in database for asset: ${query}`);
          return res.json({ images: dbImages });
        }
      } catch (dbError) {
        console.error("Error searching database for images:", dbError);
      }
      
      // If no database images, search for images in Cloudflare R2 bucket
      const results = [];
      
      try {
        console.log(`Searching R2 bucket for images matching: ${query}`);
        
        // Search in all 4 directories seen in the bucket
        const directories = [
          { path: 'dungeon-masters-guide/', name: "Dungeon Master's Guide" },
          { path: 'monster-manual/', name: "Monster Manual" },
          { path: 'phandelver-below/', name: "Phandelver Below" },
          { path: 'phb/', name: "Player's Handbook" }
        ];
        
        // Try each directory until we get enough results
        for (const dir of directories) {
          if (results.length >= 4) break; // Stop once we have enough images
          
          try {
            const dirResults = await listObjects('whispershard-assets', dir.path);
            const matches = dirResults.filter(obj => 
              obj.Key && obj.Key.toLowerCase().includes(query)
            ).slice(0, 4 - results.length); // Only take what we need
            
            // Add matches to results
            matches.forEach((match, index) => {
              results.push({
                id: `${dir.path.replace('/', '')}_${index}`,
                assetId: query,
                url: `https://7942b93dd6963bf3f88f8d7acdd3d909.r2.cloudflarestorage.com/whispershard-assets/${match.Key}`,
                caption: match.Key.split('/').pop()?.replace(/\.(webp|jpg|png|jpeg)$/, '') || query,
                source: dir.name
              });
            });
          } catch (dirError) {
            console.error(`Error searching in ${dir.path}:`, dirError);
          }
        }
        
        console.log(`Found ${results.length} images matching: ${query}`);
      } catch (error) {
        console.error("Error searching R2 bucket:", error);
      }
      
      // If we found no results, fall back to Unsplash as required in spec
      if (results.length === 0) {
        console.log("No images found for query, falling back to Unsplash");
        
        // Fallback to Unsplash images
        const unsplashImages = [
          {
            id: "img1",
            assetId: query,
            url: `https://source.unsplash.com/featured/?${encodeURIComponent(query)},fantasy&w=600`,
            caption: query.charAt(0).toUpperCase() + query.slice(1) + " - Fantasy",
            source: "Unsplash"
          },
          {
            id: "img2",
            assetId: query,
            url: `https://source.unsplash.com/featured/?${encodeURIComponent(query)},medieval&w=600`,
            caption: query.charAt(0).toUpperCase() + query.slice(1) + " - Medieval",
            source: "Unsplash"
          },
          {
            id: "img3",
            assetId: query,
            url: `https://source.unsplash.com/featured/?${encodeURIComponent(query)},rpg&w=600`,
            caption: query.charAt(0).toUpperCase() + query.slice(1) + " - RPG",
            source: "Unsplash"
          },
          {
            id: "img4",
            assetId: query,
            url: `https://source.unsplash.com/featured/?${encodeURIComponent(query)},dungeon&w=600`,
            caption: query.charAt(0).toUpperCase() + query.slice(1) + " - Dungeon",
            source: "Unsplash"
          }
        ];
        
        return res.json({ images: unsplashImages });
      }
      
      res.json({ images: results });
    } catch (error) {
      console.error("Image search error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Asset image endpoint - Get images for a specific asset ID
  app.get("/api/asset/:id/images", async (req: Request, res: Response) => {
    try {
      const assetId = req.params.id;
      
      if (!assetId) {
        return res.status(400).json({ error: "Asset ID is required" });
      }
      
      // Get images from MongoDB schema
      const images = await findImagesForAsset(assetId);
      
      // If we have no results from the database, try to find from R2 storage
      if (images.length === 0) {
        // Same fallback as in search-images endpoint
        console.log(`No images found in MongoDB for asset ID: ${assetId}, trying R2 storage`);
        
        // Try to find in R2 storage using the ID as search term
        const results = [];
        
        try {
          // Search in all 4 directories seen in the bucket
          const directories = [
            { path: 'dungeon-masters-guide/', name: "Dungeon Master's Guide" },
            { path: 'monster-manual/', name: "Monster Manual" },
            { path: 'phandelver-below/', name: "Phandelver Below" },
            { path: 'phb/', name: "Player's Handbook" }
          ];
          
          // Try each directory until we get enough results
          for (const dir of directories) {
            if (results.length >= 4) break; // Stop once we have enough images
            
            try {
              const dirResults = await listObjects('whispershard-assets', dir.path);
              const matches = dirResults.filter(obj => 
                obj.Key && obj.Key.toLowerCase().includes(assetId.toLowerCase())
              ).slice(0, 4 - results.length); // Only take what we need
              
              // Add matches to results
              matches.forEach((match, index) => {
                results.push({
                  id: `${dir.path.replace('/', '')}_${index}`,
                  assetId: assetId,
                  url: `https://7942b93dd6963bf3f88f8d7acdd3d909.r2.cloudflarestorage.com/whispershard-assets/${match.Key}`,
                  caption: match.Key.split('/').pop()?.replace(/\.(webp|jpg|png|jpeg)$/, '') || assetId,
                  source: dir.name
                });
              });
            } catch (dirError) {
              console.error(`Error searching in ${dir.path}:`, dirError);
            }
          }
          
          if (results.length > 0) {
            console.log(`Found ${results.length} images in R2 storage for asset ID: ${assetId}`);
            return res.json({ images: results });
          }
        } catch (storageError) {
          console.error("Error searching R2 storage:", storageError);
        }
        
        // If still no results, fall back to Unsplash
        console.log(`No images found in R2 storage for asset ID: ${assetId}, falling back to Unsplash`);
        const unsplashImages = [
          {
            id: "img1",
            assetId: assetId,
            url: `https://source.unsplash.com/featured/?${encodeURIComponent(assetId)},fantasy&w=600`,
            caption: assetId.charAt(0).toUpperCase() + assetId.slice(1) + " - Fantasy",
            source: "Unsplash"
          },
          {
            id: "img2",
            assetId: assetId,
            url: `https://source.unsplash.com/featured/?${encodeURIComponent(assetId)},medieval&w=600`,
            caption: assetId.charAt(0).toUpperCase() + assetId.slice(1) + " - Medieval",
            source: "Unsplash"
          }
        ];
        
        return res.json({ images: unsplashImages });
      }
      
      // Return MongoDB images if found
      res.json({ images });
    } catch (error) {
      console.error("Asset images error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Unified Asset API Endpoints
  
  // Get a unified asset by ID
  app.get("/api/unified/asset/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Asset ID is required" });
      }
      
      const asset = await findUnifiedAsset(id);
      
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      res.json({ asset });
    } catch (error) {
      console.error('Error finding unified asset:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Search for unified assets
  app.get("/api/unified/assets/search", async (req: Request, res: Response) => {
    try {
      const { q, category, limit } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const query = q.toString();
      let assetCategory = undefined;
      let maxLimit = 10;
      
      // Convert category string to enum if provided
      if (category) {
        const { AssetCategory } = await import('./services/unifiedSchema');
        if (Object.values(AssetCategory).includes(category as any)) {
          assetCategory = category as any;
        }
      }
      
      // Parse limit
      if (limit && !isNaN(parseInt(limit.toString()))) {
        maxLimit = Math.min(parseInt(limit.toString()), 50); // Cap at 50
      }
      
      const assets = await searchUnifiedAssets(query, assetCategory, maxLimit);
      
      res.json({ 
        assets,
        query,
        category: assetCategory || 'all',
        count: assets.length,
        limit: maxLimit
      });
    } catch (error) {
      console.error('Error searching unified assets:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Save/update a unified asset
  app.post("/api/unified/asset", async (req: Request, res: Response) => {
    try {
      const assetData = req.body;
      
      if (!assetData || !assetData.id || !assetData.name) {
        return res.status(400).json({ 
          error: "Invalid asset data. Required fields: id, name"
        });
      }
      
      // Parse the asset through our schema to validate it
      const { FlexibleAssetSchema } = await import('./services/unifiedSchema');
      const validatedAsset = FlexibleAssetSchema.parse(assetData);
      
      // Save to database
      const savedAsset = await saveUnifiedAsset(validatedAsset);
      
      res.json({ 
        message: "Asset saved successfully",
        asset: savedAsset
      });
    } catch (error) {
      console.error('Error saving unified asset:', error);
      
      // Handle validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ 
          error: "Invalid asset data format",
          details: error.message
        });
      }
      
      res.status(500).json({ error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
