#!/bin/bash

# Start Monitoring Services
# Runs monitoring scripts in background loops

SCRIPT_DIR="/home/ubuntu/construction_management_app/scripts"
LOG_DIR="/home/ubuntu/construction_management_app/logs"
PID_DIR="/home/ubuntu/construction_management_app/logs"

mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

echo "=== Starting Monitoring Services ==="
echo "Timestamp: $(date)"
echo ""

# Function to start a monitoring loop
start_monitor() {
    local name=$1
    local script=$2
    local interval=$3
    local pid_file="$PID_DIR/${name}.pid"
    
    # Check if already running
    if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
        echo "✓ $name already running (PID: $(cat $pid_file))"
        return 0
    fi
    
    # Start monitoring loop in background
    (
        while true; do
            bash "$script" >> /dev/null 2>&1
            sleep "$interval"
        done
    ) &
    
    echo $! > "$pid_file"
    echo "✓ Started $name (PID: $!)"
}

# Start memory monitoring (every 5 minutes)
start_monitor "memory-monitor" "$SCRIPT_DIR/monitor-memory.sh" 300

# Start OOM monitoring (every 10 minutes)  
start_monitor "oom-monitor" "$SCRIPT_DIR/monitor-oom.sh" 600

echo ""
echo "Monitoring services started successfully"
echo "To stop: bash $SCRIPT_DIR/stop-monitoring.sh"
echo "Logs: $LOG_DIR"
