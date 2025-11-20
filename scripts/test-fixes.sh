#!/bin/bash

echo "==================================="
echo "Testing Bug Fixes"
echo "==================================="
echo ""

# Test 1: Check memory usage
echo "1. Checking memory usage..."
ps aux | grep node | grep -v grep | awk '{print "Memory: " $6/1024 " MB, Process: " $11}'
echo ""

# Test 2: Check file descriptors
echo "2. Checking file descriptor limits..."
ulimit -n
echo ""

# Test 3: Check if server is running
echo "3. Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null; then
  echo "✓ Server is running"
else
  echo "✗ Server is not running"
fi
echo ""

# Test 4: Check bundle size
echo "4. Checking bundle sizes..."
if [ -d "dist/public/assets" ]; then
  ls -lh dist/public/assets/*.js | awk '{print $5 "\t" $9}'
else
  echo "Build not found. Run 'pnpm build' first."
fi
echo ""

# Test 5: Test SSE connection
echo "5. Testing SSE connection..."
timeout 3 curl -s http://localhost:3000/api/notifications/stream?userId=1 > /dev/null 2>&1
if [ $? -eq 124 ]; then
  echo "✓ SSE endpoint is accessible (timeout expected)"
else
  echo "✗ SSE endpoint error"
fi
echo ""

echo "==================================="
echo "Test Complete"
echo "==================================="
