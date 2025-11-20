# System Stability & Prevention Guide

## Overview
This document outlines comprehensive measures to prevent common development environment issues including EMFILE errors, zombie processes, and dev server instability.

## 1. EMFILE Prevention (Too Many Open Files)

### Root Causes
- File watchers accumulating from multiple dev server restarts
- Unclosed file handles in application code
- System file descriptor limits too low
- Memory leaks in file watching systems

### Prevention Measures

#### A. System-Level Configuration
```bash
# Check current limits
ulimit -n

# Increase file descriptor limit (temporary)
ulimit -n 65536

# Permanent increase (add to ~/.bashrc or ~/.zshrc)
echo "ulimit -n 65536" >> ~/.bashrc
```

#### B. Vite Configuration Optimizations
File: `vite.config.ts`
```typescript
export default defineConfig({
  server: {
    watch: {
      // Reduce number of watched files
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/coverage/**',
        '**/.turbo/**',
      ],
      // Use polling as fallback (less efficient but more stable)
      usePolling: false,
    },
    // Limit concurrent file operations
    fs: {
      strict: false,
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    exclude: ['fsevents'], // Exclude native modules
  },
});
```

#### C. Development Workflow Best Practices
1. **Always stop dev server before restarting**
   ```bash
   # Find and kill existing processes
   lsof -ti:3001 | xargs kill -9
   # Then start fresh
   pnpm dev
   ```

2. **Regular cleanup of zombie processes**
   ```bash
   # Check for zombie processes
   ps aux | grep -i defunct
   # Kill parent processes if needed
   pkill -9 node
   ```

3. **Monitor file descriptor usage**
   ```bash
   # Check current usage
   lsof | wc -l
   # Check per-process usage
   lsof -p <PID> | wc -l
   ```

## 2. Zombie Process Prevention

### What Are Zombie Processes?
Zombie processes are terminated processes that still have entries in the process table because their parent hasn't read their exit status.

### Prevention Strategies

#### A. Proper Process Management
```bash
# Create cleanup script: scripts/cleanup-processes.sh
#!/bin/bash

echo "Cleaning up development processes..."

# Kill all node processes gracefully
pkill -15 node
sleep 2

# Force kill if still running
pkill -9 node

# Clean up any remaining zombie processes
ps aux | grep -i defunct | awk '{print $2}' | xargs -r kill -9

echo "Cleanup complete!"
```

#### B. Automated Cleanup on Server Start
Add to `package.json`:
```json
{
  "scripts": {
    "predev": "pkill -9 node || true",
    "dev": "vite",
    "clean": "pkill -9 node && rm -rf node_modules/.vite"
  }
}
```

#### C. Process Monitoring
```bash
# Monitor processes continuously
watch -n 5 'ps aux | grep node'

# Check for zombie processes
ps aux | awk '$8=="Z" {print}'
```

## 3. Dev Server Stability

### Common Issues
- Port conflicts
- Memory leaks
- Hot reload failures
- WebSocket connection drops

### Solutions

#### A. Port Management
```bash
# Check if port is in use
lsof -ti:3001

# Kill process on port
lsof -ti:3001 | xargs kill -9

# Use dynamic port allocation
# In vite.config.ts:
server: {
  port: 3001,
  strictPort: false, // Try next available port if 3001 is taken
}
```

#### B. Memory Management
```bash
# Monitor memory usage
watch -n 2 'ps aux | grep node | awk "{sum+=\$6} END {print sum/1024 \" MB\"}"'

# Set Node.js memory limits
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### C. Hot Reload Optimization
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      overlay: true,
      clientPort: 3001,
    },
  },
});
```

## 4. Automated Health Checks

### Health Check Script
Create `scripts/health-check.sh`:
```bash
#!/bin/bash

echo "=== System Health Check ==="
echo ""

# Check file descriptor usage
echo "File Descriptors:"
FD_COUNT=$(lsof | wc -l)
FD_LIMIT=$(ulimit -n)
echo "  Current: $FD_COUNT / $FD_LIMIT"
if [ $FD_COUNT -gt $((FD_LIMIT * 80 / 100)) ]; then
  echo "  ⚠️  WARNING: File descriptor usage > 80%"
fi
echo ""

# Check for zombie processes
echo "Zombie Processes:"
ZOMBIE_COUNT=$(ps aux | awk '$8=="Z"' | wc -l)
echo "  Count: $ZOMBIE_COUNT"
if [ $ZOMBIE_COUNT -gt 0 ]; then
  echo "  ⚠️  WARNING: Zombie processes detected"
fi
echo ""

# Check dev server status
echo "Dev Server:"
if lsof -ti:3001 > /dev/null; then
  echo "  ✓ Running on port 3001"
else
  echo "  ✗ Not running"
fi
echo ""

# Check memory usage
echo "Memory Usage:"
ps aux | grep node | awk '{sum+=$6} END {printf "  Node.js: %.2f MB\n", sum/1024}'
echo ""

# Check disk space
echo "Disk Space:"
df -h . | tail -1 | awk '{print "  Available: " $4 " (" $5 " used)"}'
echo ""

echo "=== Health Check Complete ==="
```

Make it executable:
```bash
chmod +x scripts/health-check.sh
```

## 5. Emergency Recovery Procedures

### Complete System Reset
```bash
#!/bin/bash
# scripts/emergency-reset.sh

echo "🚨 Emergency System Reset"
echo "This will:"
echo "  - Kill all Node processes"
echo "  - Clear Vite cache"
echo "  - Reset file watchers"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Kill all node processes
  pkill -9 node
  
  # Clear caches
  rm -rf node_modules/.vite
  rm -rf .next
  rm -rf dist
  
  # Clear system file watchers (Linux)
  if [ -f /proc/sys/fs/inotify/max_user_watches ]; then
    echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_watches
  fi
  
  echo "✓ Reset complete. Run 'pnpm dev' to restart."
fi
```

### Quick Fixes Checklist
1. **Dev server won't start**
   ```bash
   lsof -ti:3001 | xargs kill -9
   pnpm dev
   ```

2. **EMFILE error**
   ```bash
   ulimit -n 65536
   pkill -9 node
   rm -rf node_modules/.vite
   pnpm dev
   ```

3. **Zombie processes**
   ```bash
   ps aux | grep -i defunct
   pkill -9 node
   ```

4. **Hot reload not working**
   ```bash
   rm -rf node_modules/.vite
   pnpm dev
   ```

## 6. Monitoring & Alerts

### Continuous Monitoring
Add to `package.json`:
```json
{
  "scripts": {
    "monitor": "watch -n 10 'bash scripts/health-check.sh'"
  }
}
```

### Automated Alerts
Create `scripts/monitor-with-alerts.sh`:
```bash
#!/bin/bash

while true; do
  FD_COUNT=$(lsof | wc -l)
  FD_LIMIT=$(ulimit -n)
  FD_PERCENT=$((FD_COUNT * 100 / FD_LIMIT))
  
  if [ $FD_PERCENT -gt 80 ]; then
    echo "⚠️  ALERT: File descriptor usage at ${FD_PERCENT}%"
    # Optional: Send notification
  fi
  
  ZOMBIE_COUNT=$(ps aux | awk '$8=="Z"' | wc -l)
  if [ $ZOMBIE_COUNT -gt 5 ]; then
    echo "⚠️  ALERT: ${ZOMBIE_COUNT} zombie processes detected"
  fi
  
  sleep 60
done
```

## 7. Best Practices Summary

### Daily Development
- ✅ Always use `pnpm dev` (includes cleanup)
- ✅ Stop server with Ctrl+C before restarting
- ✅ Run health check before major changes
- ✅ Monitor file descriptor usage periodically

### Weekly Maintenance
- ✅ Clear Vite cache: `rm -rf node_modules/.vite`
- ✅ Check for zombie processes: `ps aux | grep defunct`
- ✅ Review system logs for errors
- ✅ Update dependencies: `pnpm update`

### Monthly Audit
- ✅ Review and optimize Vite configuration
- ✅ Check system resource limits
- ✅ Clean up old log files
- ✅ Verify backup procedures

## 8. Troubleshooting Guide

### Problem: "EMFILE: too many open files"
**Solution:**
1. Increase file descriptor limit: `ulimit -n 65536`
2. Kill existing processes: `pkill -9 node`
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Restart dev server: `pnpm dev`

### Problem: Dev server becomes unresponsive
**Solution:**
1. Check for zombie processes: `ps aux | grep defunct`
2. Kill all node processes: `pkill -9 node`
3. Check port availability: `lsof -ti:3001`
4. Restart with clean state: `pnpm clean && pnpm dev`

### Problem: Hot reload stops working
**Solution:**
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Check file watcher limits (Linux): `cat /proc/sys/fs/inotify/max_user_watches`
3. Increase if needed: `echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_watches`
4. Restart dev server

### Problem: Memory usage keeps growing
**Solution:**
1. Monitor memory: `watch -n 5 'ps aux | grep node'`
2. Set memory limit: `export NODE_OPTIONS="--max-old-space-size=4096"`
3. Restart dev server regularly during heavy development
4. Check for memory leaks in application code

## 9. Prevention Checklist

Before starting development:
- [ ] Check file descriptor limit: `ulimit -n` (should be > 10000)
- [ ] Verify no zombie processes: `ps aux | grep defunct`
- [ ] Confirm port 3001 is free: `lsof -ti:3001`
- [ ] Clear old caches: `rm -rf node_modules/.vite`

During development:
- [ ] Monitor resource usage periodically
- [ ] Stop server properly before restarting
- [ ] Watch for EMFILE warnings in logs
- [ ] Keep terminal output visible for errors

After development:
- [ ] Stop dev server: Ctrl+C
- [ ] Verify processes stopped: `lsof -ti:3001`
- [ ] Clean up if needed: `pkill -9 node`

## 10. Additional Resources

### Useful Commands Reference
```bash
# Process management
ps aux | grep node                    # List all node processes
lsof -ti:3001                        # Find process on port 3001
pkill -9 node                        # Kill all node processes
kill -9 <PID>                        # Kill specific process

# File descriptor management
ulimit -n                            # Check current limit
lsof | wc -l                         # Count open files
lsof -p <PID> | wc -l               # Count files for process

# System monitoring
top                                  # Real-time process monitor
htop                                 # Enhanced process monitor
watch -n 5 'ps aux | grep node'     # Watch node processes

# Cleanup
rm -rf node_modules/.vite           # Clear Vite cache
rm -rf .next dist build             # Clear build artifacts
pnpm store prune                    # Clean pnpm store
```

### Configuration Files to Review
- `vite.config.ts` - Dev server configuration
- `package.json` - Scripts and dependencies
- `.gitignore` - Exclude cache directories
- `tsconfig.json` - TypeScript configuration

---

**Last Updated:** 2025-11-14
**Maintainer:** Development Team
**Version:** 1.0.0
