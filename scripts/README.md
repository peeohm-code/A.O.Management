# System Maintenance Scripts

This directory contains scripts for maintaining system stability and preventing common development environment issues.

## Available Scripts

### 1. Health Check (`health-check.sh`)
Performs comprehensive system health checks including:
- File descriptor usage monitoring
- Zombie process detection
- Dev server status verification
- Memory usage tracking
- Disk space monitoring
- Cache size reporting

**Usage:**
```bash
# Run directly
bash scripts/health-check.sh

# Or via npm
pnpm health
```

**Exit Codes:**
- `0`: System healthy
- `1`: Critical issues detected (requires immediate attention)

**Thresholds:**
- File descriptors: Warning at 80%, Critical at 90%
- Disk space: Warning at 90%, Critical at 95%
- Node processes: Warning at 10+
- Zombie processes: Warning at 13+ (system zombies are normal in sandbox)

---

### 2. Cleanup Processes (`cleanup-processes.sh`)
Safely terminates all Node.js processes and cleans up zombie processes.

**Usage:**
```bash
# Run directly
bash scripts/cleanup-processes.sh

# Or via npm
pnpm cleanup
```

**What it does:**
1. Sends SIGTERM to all node processes (graceful shutdown)
2. Waits 2 seconds for processes to terminate
3. Force kills remaining processes with SIGKILL
4. Cleans up zombie processes
5. Reports final process count

**When to use:**
- Before restarting dev server after crashes
- When experiencing EMFILE errors
- After multiple failed server restarts
- When dev server becomes unresponsive

---

### 3. Emergency Reset (`emergency-reset.sh`)
Performs complete system reset including process cleanup, cache clearing, and file watcher reset.

**Usage:**
```bash
# Run directly
bash scripts/emergency-reset.sh

# Or via npm
pnpm reset
```

**What it does:**
1. Kills all Node processes
2. Clears Vite cache (`node_modules/.vite`)
3. Removes build artifacts (`.next`, `dist`, `build`)
4. Clears temporary files (`.turbo`, `coverage`, `.cache`)
5. Resets file watcher limits (Linux only, requires sudo)

**When to use:**
- When dev server won't start despite cleanup
- After experiencing persistent EMFILE errors
- When hot reload completely stops working
- As last resort before reinstalling dependencies

**⚠️ Warning:** This is a destructive operation. You'll need to restart the dev server after running this script.

---

## Automated Integration

### Pre-dev Hook
The `predev` script in `package.json` automatically runs before `pnpm dev`:
```json
"predev": "lsof -ti:3001 | xargs kill -9 2>/dev/null || true"
```

This ensures port 3001 is free before starting the dev server.

### Quick Commands
```bash
# Check system health
pnpm health

# Clean up processes
pnpm cleanup

# Emergency reset
pnpm reset

# Start dev server (with auto-cleanup)
pnpm dev
```

---

## Monitoring Best Practices

### Daily Development
1. Run `pnpm health` at the start of each dev session
2. Monitor terminal output for warnings
3. Use Ctrl+C to stop dev server properly
4. Run `pnpm cleanup` if you see EMFILE errors

### Weekly Maintenance
1. Run `pnpm health` to check overall system status
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Review zombie process count
4. Check disk space usage

### Emergency Procedures
If dev server won't start:
1. Try `pnpm cleanup` first
2. If that fails, try `pnpm reset`
3. If still failing, check `SYSTEM_STABILITY.md` for detailed troubleshooting

---

## Understanding the Output

### File Descriptor Usage
```
File Descriptors:
  Current: 36828 / 65536
  ✓ File descriptor usage OK (56%)
```
- Shows current open files vs system limit
- OK: < 80%
- Warning: 80-90%
- Critical: > 90%

### Zombie Processes
```
Zombie Processes:
  Count: 13
  ⚠️  WARNING: Zombie processes detected
```
- Zombie processes are terminated processes waiting for parent to read exit status
- System zombies (root owned) are normal in sandbox environments
- Application zombies (ubuntu owned) should be investigated

### Dev Server Status
```
Dev Server:
  ✓ Running on port 3001 (PID: 104647)
  Memory: 294.344 MB
```
- Confirms dev server is running
- Shows process ID for manual management if needed
- Monitors memory usage (typical: 200-500 MB)

### Node Processes
```
Node Processes:
  Active processes: 14
  ⚠️  WARNING: Many node processes running
  Total memory: 1668.32 MB
```
- Counts all active node processes
- Warning if > 10 processes (may indicate leaked processes)
- Shows total memory usage across all node processes

---

## Troubleshooting

### "Permission denied" errors
Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Scripts not found
Ensure you're in the project root directory:
```bash
cd /home/ubuntu/construction_management_app
```

### Health check fails with "command not found"
Required commands: `lsof`, `ps`, `awk`, `df`
These should be pre-installed on Ubuntu systems.

---

## Related Documentation

- **SYSTEM_STABILITY.md**: Comprehensive guide to preventing system issues
- **package.json**: See `scripts` section for npm command aliases
- **vite.config.ts**: Dev server configuration and optimization settings

---

## Contributing

When adding new scripts:
1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add npm alias in `package.json`
3. Document usage in this README
4. Include error handling and user feedback
5. Test in sandbox environment before committing

---

**Last Updated:** 2025-11-14
**Maintainer:** Development Team
