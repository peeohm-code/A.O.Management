#!/bin/bash

echo "=== System Health Check ==="
echo ""

# Check file descriptor usage
echo "File Descriptors:"
FD_COUNT=$(lsof 2>/dev/null | wc -l)
FD_LIMIT=$(ulimit -n)
echo "  Current: $FD_COUNT / $FD_LIMIT"
FD_PERCENT=$((FD_COUNT * 100 / FD_LIMIT))
if [ $FD_PERCENT -gt 80 ]; then
  echo "  ⚠️  WARNING: File descriptor usage > 80% ($FD_PERCENT%)"
else
  echo "  ✓ File descriptor usage OK ($FD_PERCENT%)"
fi
echo ""

# Check for zombie processes
echo "Zombie Processes:"
ZOMBIE_COUNT=$(ps aux | awk '$8=="Z"' | wc -l)
echo "  Count: $ZOMBIE_COUNT"
if [ $ZOMBIE_COUNT -gt 0 ]; then
  echo "  ⚠️  WARNING: Zombie processes detected"
  ps aux | awk '$8=="Z"' | head -5
else
  echo "  ✓ No zombie processes"
fi
echo ""

# Check dev server status
echo "Dev Server:"
if lsof -ti:3001 2>/dev/null > /dev/null; then
  PID=$(lsof -ti:3001)
  echo "  ✓ Running on port 3001 (PID: $PID)"
  # Check memory usage of dev server
  MEM=$(ps -p $PID -o rss= 2>/dev/null | awk '{print $1/1024}')
  if [ ! -z "$MEM" ]; then
    echo "  Memory: ${MEM} MB"
  fi
else
  echo "  ✗ Not running on port 3001"
fi
echo ""

# Check all node processes
echo "Node Processes:"
NODE_COUNT=$(ps aux | grep -v grep | grep node | wc -l)
echo "  Active processes: $NODE_COUNT"
if [ $NODE_COUNT -gt 5 ]; then
  echo "  ⚠️  WARNING: Many node processes running"
fi
# Show memory usage of all node processes
NODE_MEM=$(ps aux | grep -v grep | grep node | awk '{sum+=$6} END {printf "%.2f", sum/1024}')
if [ ! -z "$NODE_MEM" ]; then
  echo "  Total memory: ${NODE_MEM} MB"
fi
echo ""

# Check disk space
echo "Disk Space:"
df -h . | tail -1 | awk '{print "  Available: " $4 " (" $5 " used)"}'
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
  echo "  ⚠️  WARNING: Disk usage > 90%"
else
  echo "  ✓ Disk space OK"
fi
echo ""

# Check for common cache directories
echo "Cache Status:"
if [ -d "node_modules/.vite" ]; then
  VITE_SIZE=$(du -sh node_modules/.vite 2>/dev/null | awk '{print $1}')
  echo "  Vite cache: $VITE_SIZE"
else
  echo "  Vite cache: Not found"
fi
echo ""

# Summary
echo "=== Health Check Complete ==="
echo ""

# Exit with error if critical issues found
# Note: Zombie processes from system (root) are normal in sandbox environments
# Only alert if file descriptors or disk usage are critically high
if [ $FD_PERCENT -gt 90 ] || [ $DISK_USAGE -gt 95 ]; then
  echo "❌ Critical issues detected!"
  exit 1
else
  if [ $ZOMBIE_COUNT -gt 20 ] || [ $NODE_COUNT -gt 10 ]; then
    echo "⚠️  System healthy but with warnings"
  else
    echo "✅ System healthy"
  fi
  exit 0
fi
