import { EventEmitter } from 'events';
import type { Request, Response } from 'express';

/**
 * Real-time Notification System using Server-Sent Events (SSE)
 * 
 * This module provides real-time notification capabilities for:
 * - Task updates (status changes, assignments, comments)
 * - Defect updates (new defects, status changes, escalations)
 * - QC Inspection updates (new inspections, results, approvals)
 * - General notifications
 */

// Event types
export type NotificationEvent = {
  type: 'task_update' | 'defect_update' | 'inspection_update' | 'notification';
  userId: number;
  data: any;
  timestamp: Date;
};

// Global event emitter for notifications
class NotificationEmitter extends EventEmitter {
  private connections: Map<number, Set<Response>> = new Map();

  /**
   * Register a new SSE connection for a user
   */
  addConnection(userId: number, res: Response) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);
    console.log(`[SSE] User ${userId} connected. Total connections: ${this.getTotalConnections()}`);
  }

  /**
   * Remove SSE connection for a user
   */
  removeConnection(userId: number, res: Response) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(res);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
    console.log(`[SSE] User ${userId} disconnected. Total connections: ${this.getTotalConnections()}`);
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId: number, event: NotificationEvent) {
    const userConnections = this.connections.get(userId);
    if (userConnections && userConnections.size > 0) {
      const data = JSON.stringify(event);
      userConnections.forEach((res) => {
        try {
          res.write(`data: ${data}\n\n`);
        } catch (error) {
          console.error(`[SSE] Error sending to user ${userId}:`, error);
          this.removeConnection(userId, res);
        }
      });
      console.log(`[SSE] Sent ${event.type} to user ${userId} (${userConnections.size} connections)`);
    }
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: number[], event: Omit<NotificationEvent, 'userId'>) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, { ...event, userId });
    });
  }

  /**
   * Get total number of active connections
   */
  getTotalConnections(): number {
    let total = 0;
    this.connections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }

  /**
   * Get number of connections for a specific user
   */
  getUserConnections(userId: number): number {
    return this.connections.get(userId)?.size || 0;
  }
}

// Singleton instance
export const notificationEmitter = new NotificationEmitter();

/**
 * SSE endpoint handler
 */
export function handleSSEConnection(req: Request, res: Response, userId: number) {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date() })}\n\n`);

  // Register connection
  notificationEmitter.addConnection(userId, res);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat\n\n`);
    } catch (error) {
      console.error(`[SSE] Heartbeat error for user ${userId}:`, error);
      clearInterval(heartbeatInterval);
      notificationEmitter.removeConnection(userId, res);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    notificationEmitter.removeConnection(userId, res);
  });
}

/**
 * Helper functions to emit specific event types
 */

export function notifyTaskUpdate(userIds: number[], taskData: any) {
  notificationEmitter.sendToUsers(userIds, {
    type: 'task_update',
    data: taskData,
    timestamp: new Date(),
  });
}

export function notifyDefectUpdate(userIds: number[], defectData: any) {
  notificationEmitter.sendToUsers(userIds, {
    type: 'defect_update',
    data: defectData,
    timestamp: new Date(),
  });
}

export function notifyInspectionUpdate(userIds: number[], inspectionData: any) {
  notificationEmitter.sendToUsers(userIds, {
    type: 'inspection_update',
    data: inspectionData,
    timestamp: new Date(),
  });
}

export function notifyGeneral(userIds: number[], notificationData: any) {
  notificationEmitter.sendToUsers(userIds, {
    type: 'notification',
    data: notificationData,
    timestamp: new Date(),
  });
}
