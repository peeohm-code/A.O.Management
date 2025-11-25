import { Router } from 'express';
import { handleSSEConnection } from '../realtimeNotifications';
import { sdk } from '../_core/sdk';

/**
 * Real-time Notifications Router
 * Provides SSE endpoint for real-time updates
 */
export const realtimeRouter = Router();

/**
 * SSE endpoint for real-time notifications
 * GET /api/realtime/notifications
 */
realtimeRouter.get('/notifications', async (req, res) => {
  try {
    // Verify authentication using SDK
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Handle SSE connection
    handleSSEConnection(req, res, user.id);
  } catch (error) {
    console.error('[SSE] Connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 * GET /api/realtime/health
 */
realtimeRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
