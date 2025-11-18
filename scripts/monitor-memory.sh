#!/bin/bash
# Memory monitoring script to prevent OOM

echo "=== Memory Monitor ==="
echo "Timestamp: $(date)"
echo ""

# System memory
echo "System Memory:"
free -h
echo ""

# Node processes memory
echo "Node.js Processes:"
ps aux | grep -E "node|tsx|nodemon" | grep -v grep | awk '{printf "PID: %s | Memory: %s | Command: %s\n", $2, $6, $11}'
echo ""

# Open file descriptors
echo "File Descriptors:"
ulimit -n
echo ""

# Check for high memory processes
echo "Top 5 Memory Consumers:"
ps aux --sort=-%mem | head -6
echo ""

# Warning if memory usage is high
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    echo "⚠️  WARNING: Memory usage is at ${MEMORY_USAGE}%"
else
    echo "✅ Memory usage is healthy at ${MEMORY_USAGE}%"
fi
