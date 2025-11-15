#!/bin/bash

# OOM (Out of Memory) Detection Script
# Monitors system logs for OOM killer events

LOG_DIR="/home/ubuntu/construction_management_app/logs"
OOM_LOG="$LOG_DIR/oom-events.log"
LAST_CHECK_FILE="$LOG_DIR/.oom-last-check"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Get timestamp of last check
if [ -f "$LAST_CHECK_FILE" ]; then
    LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
    LAST_CHECK="1 hour ago"
fi

# Check for OOM events in system logs since last check
OOM_EVENTS=$(sudo journalctl --since "$LAST_CHECK" | grep -i "out of memory\|oom-kill\|killed process" || echo "")

if [ -n "$OOM_EVENTS" ]; then
    echo "$TIMESTAMP | ⚠️  OOM EVENT DETECTED" >> "$OOM_LOG"
    echo "$OOM_EVENTS" >> "$OOM_LOG"
    echo "---" >> "$OOM_LOG"
    
    # Output to console if running interactively
    if [ -t 1 ]; then
        echo "⚠️  OOM EVENT DETECTED"
        echo "$OOM_EVENTS"
        echo ""
        echo "Details logged to: $OOM_LOG"
    fi
else
    # Log check with no events found
    if [ -t 1 ]; then
        echo "✓ No OOM events detected since $LAST_CHECK"
    fi
fi

# Update last check timestamp
echo "$TIMESTAMP" > "$LAST_CHECK_FILE"

# Rotate log if it exceeds 10MB
if [ -f "$OOM_LOG" ]; then
    LOG_SIZE=$(stat -f%z "$OOM_LOG" 2>/dev/null || stat -c%s "$OOM_LOG" 2>/dev/null || echo 0)
    if [ "$LOG_SIZE" -gt 10485760 ]; then
        mv "$OOM_LOG" "$OOM_LOG.old"
        echo "$TIMESTAMP | Log rotated" > "$OOM_LOG"
    fi
fi
