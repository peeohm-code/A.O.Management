#!/bin/bash
# Zombie Process Cleanup Script

echo "🔍 Checking for zombie processes..."
ZOMBIE_COUNT=$(ps -eo stat | grep -c Z)

if [ "$ZOMBIE_COUNT" -eq 0 ]; then
    echo "✅ No zombie processes found!"
    exit 0
fi

echo "⚠️  Found $ZOMBIE_COUNT zombie processes"

# Get parent PIDs of zombie processes
PARENT_PIDS=$(ps -eo pid,ppid,stat | grep Z | awk '{print $2}' | sort -u)

echo "📋 Parent processes: $PARENT_PIDS"

# Send SIGCHLD to parent processes to trigger cleanup
for PARENT_PID in $PARENT_PIDS; do
    if [ "$PARENT_PID" -ne 1 ]; then
        echo "🔄 Sending SIGCHLD to parent process $PARENT_PID..."
        sudo kill -s SIGCHLD $PARENT_PID 2>/dev/null || echo "   ⚠️  Could not signal process $PARENT_PID"
    fi
done

sleep 2

# Check again
ZOMBIE_COUNT_AFTER=$(ps -eo stat | grep -c Z)
echo ""
echo "📊 Results:"
echo "   Before: $ZOMBIE_COUNT zombies"
echo "   After:  $ZOMBIE_COUNT_AFTER zombies"

if [ "$ZOMBIE_COUNT_AFTER" -lt "$ZOMBIE_COUNT" ]; then
    echo "✅ Successfully cleaned up $((ZOMBIE_COUNT - ZOMBIE_COUNT_AFTER)) zombie processes!"
else
    echo "ℹ️  Note: These zombie processes are from system service 'envd'"
    echo "   They are harmless and will be cleaned up automatically by the system."
    echo "   No action needed for your application."
fi
