import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {

    socket.on("disconnect", () => {
    });

    // Join user-specific room
    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
}

// Notification types
export interface Notification {
  id: string;
  type: "project_status" | "task_status" | "task_assigned" | "comment_added" | "defect_reported";
  title: string;
  message: string;
  link?: string;
  timestamp: Date;
  read: boolean;
}

// Emit notification to specific user
export function emitNotification(userId: number, notification: Notification) {
  try {
    const socketIO = getIO();
    socketIO.to(`user:${userId}`).emit("notification", notification);
  } catch (error) {
    console.error("[Socket.io] Failed to emit notification:", error);
  }
}

// Emit notification to all users
export function broadcastNotification(notification: Notification) {
  try {
    const socketIO = getIO();
    socketIO.emit("notification", notification);
  } catch (error) {
    console.error("[Socket.io] Failed to broadcast notification:", error);
  }
}
