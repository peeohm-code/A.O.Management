import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import multer from "multer";
import sharp from "sharp";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storagePut } from "../storage";
import { initializeSocket } from "./socket";
import { initializeCronJobs } from "../cron/scheduler";
import { apiRateLimit, strictRateLimit } from "../middleware/rateLimiter";
import { validateFile, sanitizeFilename } from "../utils/sanitize";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize Socket.io
  initializeSocket(server);
  // Apply rate limiting to all API routes
  app.use("/api", apiRateLimit);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Configure multer for file uploads (memory storage)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
  });
  
  // File upload endpoint with image compression (with stricter rate limit)
  app.post("/api/upload", strictRateLimit, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Validate file
      const validation = validateFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      
      let fileBuffer = req.file.buffer;
      let contentType = req.file.mimetype;
      
      // If it's an image, compress and resize it
      if (req.file.mimetype.startsWith('image/')) {
        try {
          fileBuffer = await sharp(req.file.buffer)
            .resize(1920, 1920, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .jpeg({
              quality: 85,
              progressive: true,
            })
            .toBuffer();
          contentType = 'image/jpeg';
        } catch (sharpError) {
          console.warn('Image compression failed, uploading original:', sharpError);
          // If compression fails, upload original
        }
      }
      
      // Generate unique file key
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = contentType === 'image/jpeg' ? 'jpg' : req.file.originalname.split('.').pop();
      const fileKey = `inspections/${timestamp}-${randomStr}.${fileExt}`;
      
      // Upload to S3
      const { url } = await storagePut(
        fileKey,
        fileBuffer,
        contentType
      );
      
      res.json({ url, key: fileKey });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "Upload failed" });
    }
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize cron jobs after server starts
    initializeCronJobs();
  });
}

startServer().catch(console.error);
