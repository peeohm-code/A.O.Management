import { Request, Response } from "express";
import { EventEmitter } from "events";

// Global event emitter for SSE
export const notificationEmitter = new EventEmitter();

// Store active SSE connections
const sseClients = new Map<string, Response>();

/**
 * SSE endpoint handler
 * Establishes a persistent connection for real-time notifications
 */
export function handleSSE(req: Request, res: Response) {
  const userId = req.query.userId as string;

  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering for nginx

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE connection established" })}\n\n`);

  // Store client connection
  sseClients.set(userId, res);

  console.log(`[SSE] Client connected: ${userId}`);

  // Handle client disconnect
  req.on("close", () => {
    sseClients.delete(userId);
    console.log(`[SSE] Client disconnected: ${userId}`);
  });

  // Keep connection alive with periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000); // Every 30 seconds

  req.on("close", () => {
    clearInterval(heartbeatInterval);
  });
}

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId: number, notification: any) {
  const client = sseClients.get(String(userId));
  if (client) {
    try {
      client.write(`data: ${JSON.stringify(notification)}\n\n`);
      console.log(`[SSE] Notification sent to user ${userId}:`, notification.type);
    } catch (error) {
      console.error(`[SSE] Error sending notification to user ${userId}:`, error);
      sseClients.delete(String(userId));
    }
  }
}

/**
 * Broadcast notification to all connected users
 */
export function broadcastNotification(notification: any) {
  let successCount = 0;
  let errorCount = 0;

  sseClients.forEach((client, userId) => {
    try {
      client.write(`data: ${JSON.stringify(notification)}\n\n`);
      successCount++;
    } catch (error) {
      console.error(`[SSE] Error broadcasting to user ${userId}:`, error);
      sseClients.delete(userId);
      errorCount++;
    }
  });

  console.log(`[SSE] Broadcast complete: ${successCount} sent, ${errorCount} failed`);
}

/**
 * Send notification to multiple users
 */
export function sendNotificationToUsers(userIds: number[], notification: any) {
  userIds.forEach((userId) => {
    sendNotificationToUser(userId, notification);
  });
}

/**
 * Get count of active SSE connections
 */
export function getActiveConnectionsCount(): number {
  return sseClients.size;
}

/**
 * Get list of connected user IDs
 */
export function getConnectedUserIds(): string[] {
  return Array.from(sseClients.keys());
}

// Listen to notification events
notificationEmitter.on("notification", (data: { userId: number; notification: any }) => {
  sendNotificationToUser(data.userId, data.notification);
});

notificationEmitter.on("broadcast", (notification: any) => {
  broadcastNotification(notification);
});

notificationEmitter.on("multicast", (data: { userIds: number[]; notification: any }) => {
  sendNotificationToUsers(data.userIds, data.notification);
});
