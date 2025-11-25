#!/bin/bash

echo "🚨 Emergency System Reset"
echo ""
echo "This will:"
echo "  - Kill all Node processes"
echo "  - Clear Vite cache"
echo "  - Clear build artifacts"
echo "  - Reset file watchers"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting emergency reset..."
  echo ""
  
  # 1. Kill all node processes
  echo "1/5 Killing all Node processes..."
  pkill -9 node 2>/dev/null
  sleep 1
  echo "✓ Done"
  
  # 2. Clear Vite cache
  echo "2/5 Clearing Vite cache..."
  if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "✓ Vite cache cleared"
  else
    echo "✓ No Vite cache found"
  fi
  
  # 3. Clear build artifacts
  echo "3/5 Clearing build artifacts..."
  rm -rf .next dist build 2>/dev/null
  echo "✓ Build artifacts cleared"
  
  # 4. Clear temporary files
  echo "4/5 Clearing temporary files..."
  rm -rf .turbo coverage .cache 2>/dev/null
  echo "✓ Temporary files cleared"
  
  # 5. Reset file watchers (if on Linux)
  echo "5/5 Resetting file watchers..."
  if [ -f /proc/sys/fs/inotify/max_user_watches ]; then
    # Try to increase file watcher limit (requires sudo)
    if command -v sudo &> /dev/null; then
      echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_watches > /dev/null 2>&1
      if [ $? -eq 0 ]; then
        echo "✓ File watcher limit increased"
      else
        echo "⚠️  Could not increase file watcher limit (no sudo access)"
      fi
    else
      echo "⚠️  Sudo not available, skipping file watcher reset"
    fi
  else
    echo "✓ Not on Linux, skipping file watcher reset"
  fi
  
  echo ""
  echo "✅ Emergency reset complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Run 'pnpm dev' to restart the dev server"
  echo "  2. If issues persist, try 'pnpm install' to reinstall dependencies"
  echo ""
else
  echo "Reset cancelled."
  exit 1
fi
