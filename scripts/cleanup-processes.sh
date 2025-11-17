#!/bin/bash

echo "🧹 Cleaning up development processes..."
echo ""

# Count processes before cleanup
NODE_COUNT_BEFORE=$(ps aux | grep -v grep | grep node | wc -l)
echo "Node processes before cleanup: $NODE_COUNT_BEFORE"

# Kill all node processes gracefully first
echo "Sending SIGTERM to node processes..."
pkill -15 node 2>/dev/null
sleep 2

# Check if any are still running
NODE_COUNT_AFTER=$(ps aux | grep -v grep | grep node | wc -l)
if [ $NODE_COUNT_AFTER -gt 0 ]; then
  echo "Force killing remaining processes..."
  pkill -9 node 2>/dev/null
  sleep 1
fi

# Clean up any remaining zombie processes
ZOMBIE_COUNT=$(ps aux | awk '$8=="Z"' | wc -l)
if [ $ZOMBIE_COUNT -gt 0 ]; then
  echo "Cleaning up $ZOMBIE_COUNT zombie processes..."
  ps aux | awk '$8=="Z" {print $2}' | xargs -r kill -9 2>/dev/null
fi

# Final count
NODE_COUNT_FINAL=$(ps aux | grep -v grep | grep node | wc -l)
echo ""
echo "✓ Cleanup complete!"
echo "Node processes remaining: $NODE_COUNT_FINAL"

if [ $NODE_COUNT_FINAL -eq 0 ]; then
  echo "✅ All processes cleaned up successfully"
  exit 0
else
  echo "⚠️  Warning: Some processes may still be running"
  ps aux | grep -v grep | grep node
  exit 1
fi
