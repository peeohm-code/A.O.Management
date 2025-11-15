#!/bin/bash

# Memory Monitoring Script
# Logs memory usage and alerts when thresholds are exceeded

LOG_DIR="/home/ubuntu/construction_management_app/logs"
LOG_FILE="$LOG_DIR/memory-monitor.log"
ALERT_THRESHOLD=80  # Alert when memory usage exceeds 80%

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Get current memory stats
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
MEM_USED=$(free -m | awk 'NR==2{print $3}')
MEM_FREE=$(free -m | awk 'NR==2{print $4}')
MEM_AVAILABLE=$(free -m | awk 'NR==2{print $7}')
MEM_PERCENT=$(awk "BEGIN {printf \"%.1f\", ($MEM_USED/$MEM_TOTAL)*100}")

SWAP_TOTAL=$(free -m | awk 'NR==3{print $2}')
SWAP_USED=$(free -m | awk 'NR==3{print $3}')
SWAP_FREE=$(free -m | awk 'NR==3{print $4}')
SWAP_PERCENT=$(awk "BEGIN {if($SWAP_TOTAL>0) printf \"%.1f\", ($SWAP_USED/$SWAP_TOTAL)*100; else print \"0\"}")

# Log to file
echo "$TIMESTAMP | MEM: ${MEM_USED}/${MEM_TOTAL}MB (${MEM_PERCENT}%) | SWAP: ${SWAP_USED}/${SWAP_TOTAL}MB (${SWAP_PERCENT}%)" >> "$LOG_FILE"

# Check if memory usage exceeds threshold
if (( $(echo "$MEM_PERCENT > $ALERT_THRESHOLD" | bc -l) )); then
    echo "$TIMESTAMP | ⚠️  HIGH MEMORY USAGE: ${MEM_PERCENT}%" >> "$LOG_FILE"
    
    # Log top memory-consuming processes
    echo "$TIMESTAMP | Top 5 memory consumers:" >> "$LOG_FILE"
    ps aux --sort=-%mem | head -6 | tail -5 >> "$LOG_FILE"
    
    # Output to console if running interactively
    if [ -t 1 ]; then
        echo "⚠️  HIGH MEMORY USAGE: ${MEM_PERCENT}%"
        echo "Top 5 memory consumers:"
        ps aux --sort=-%mem | head -6
    fi
fi

# Rotate log if it exceeds 10MB
LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LOG_SIZE" -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "$TIMESTAMP | Log rotated" > "$LOG_FILE"
fi

# Output current status if running interactively
if [ -t 1 ]; then
    echo "=== Memory Status ==="
    echo "Timestamp: $TIMESTAMP"
    echo "Memory: ${MEM_USED}/${MEM_TOTAL}MB (${MEM_PERCENT}%)"
    echo "Available: ${MEM_AVAILABLE}MB"
    echo "Swap: ${SWAP_USED}/${SWAP_TOTAL}MB (${SWAP_PERCENT}%)"
    echo ""
    echo "Log file: $LOG_FILE"
fi
