#!/bin/bash
# Cleanup zombie processes script

echo "🧟 Checking for zombie processes..."

ZOMBIE_COUNT=$(ps aux | awk '$8=="Z"' | wc -l)

if [ "$ZOMBIE_COUNT" -eq 0 ]; then
    echo "✅ No zombie processes found"
    exit 0
fi

echo "⚠️  Found $ZOMBIE_COUNT zombie processes"
ps aux | awk '$8=="Z"' | head -10

echo ""
echo "🔍 Finding parent processes..."
ps aux | awk '$8=="Z"' | while read line; do
    PID=$(echo $line | awk '{print $2}')
    PPID=$(ps -o ppid= -p $PID 2>/dev/null | tr -d ' ')
    if [ ! -z "$PPID" ]; then
        PARENT_CMD=$(ps -o comm= -p $PPID 2>/dev/null)
        echo "Zombie PID $PID has parent $PPID ($PARENT_CMD)"
    fi
done

echo ""
echo "💡 Note: Zombie processes owned by 'root' cannot be cleaned by ubuntu user"
echo "💡 These zombies will be cleaned when their parent process exits"
echo "💡 If zombies persist, consider restarting the sandbox"
