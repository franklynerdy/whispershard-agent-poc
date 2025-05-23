import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initMongoDB } from "./services/mongodb";
import { initPinecone } from "./services/pinecone";
import { initCloudflareR2 } from "./services/cloudflare";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize MongoDB connection
    console.log("Initializing MongoDB connection...");
    await initMongoDB();
    console.log("MongoDB connection established");
    
    // Initialize Pinecone vector database
    try {
      await initPinecone();
      console.log("Pinecone initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Pinecone:", error);
      // Continue even if Pinecone fails - non-critical
    }
    
    // Initialize Cloudflare R2
    try {
      const r2Status = await initCloudflareR2();
      if (r2Status.connected) {
        console.log("Cloudflare R2 initialized successfully");
      } else {
        console.warn("Cloudflare R2 initialization warning:", r2Status.error);
      }
    } catch (error) {
      console.error("Failed to initialize Cloudflare R2:", error);
      // Continue even if R2 fails - non-critical
    }
  } catch (error) {
    console.error("Failed to initialize MongoDB:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
