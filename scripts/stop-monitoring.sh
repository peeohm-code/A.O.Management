#!/bin/bash

# Stop Monitoring Services

PID_DIR="/home/ubuntu/construction_management_app/logs"

echo "=== Stopping Monitoring Services ==="
echo "Timestamp: $(date)"
echo ""

# Function to stop a monitor
stop_monitor() {
    local name=$1
    local pid_file="$PID_DIR/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            rm -f "$pid_file"
            echo "✓ Stopped $name (PID: $pid)"
        else
            rm -f "$pid_file"
            echo "⚠ $name was not running"
        fi
    else
        echo "⚠ $name PID file not found"
    fi
}

# Stop all monitors
stop_monitor "memory-monitor"
stop_monitor "oom-monitor"

echo ""
echo "Monitoring services stopped"
