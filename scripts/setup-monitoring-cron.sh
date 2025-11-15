#!/bin/bash

# Setup Cron Jobs for Automated Monitoring
# This script configures cron jobs for memory and OOM monitoring

SCRIPT_DIR="/home/ubuntu/construction_management_app/scripts"

echo "=== Setting up Automated Monitoring ==="
echo ""

# Check if scripts exist and are executable
if [ ! -x "$SCRIPT_DIR/monitor-memory.sh" ]; then
    echo "⚠️  monitor-memory.sh not found or not executable"
    chmod +x "$SCRIPT_DIR/monitor-memory.sh" 2>/dev/null
fi

if [ ! -x "$SCRIPT_DIR/monitor-oom.sh" ]; then
    echo "⚠️  monitor-oom.sh not found or not executable"
    chmod +x "$SCRIPT_DIR/monitor-oom.sh" 2>/dev/null
fi

# Create cron jobs (will be added to user's crontab)
CRON_JOBS="
# Construction Management App - System Monitoring
# Memory monitoring every 5 minutes
*/5 * * * * $SCRIPT_DIR/monitor-memory.sh >> /dev/null 2>&1

# OOM detection every 10 minutes
*/10 * * * * $SCRIPT_DIR/monitor-oom.sh >> /dev/null 2>&1

# Zombie process cleanup daily at 3 AM
0 3 * * * $SCRIPT_DIR/cleanup-zombies.sh >> /dev/null 2>&1
"

# Check if cron jobs already exist
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -c "Construction Management App - System Monitoring")

if [ "$EXISTING_CRON" -gt 0 ]; then
    echo "✓ Monitoring cron jobs already configured"
    echo ""
    echo "Current cron jobs:"
    crontab -l 2>/dev/null | grep -A 10 "Construction Management App"
else
    # Add cron jobs
    (crontab -l 2>/dev/null; echo "$CRON_JOBS") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✓ Monitoring cron jobs configured successfully"
        echo ""
        echo "Scheduled tasks:"
        echo "  - Memory monitoring: Every 5 minutes"
        echo "  - OOM detection: Every 10 minutes"
        echo "  - Zombie cleanup: Daily at 3 AM"
    else
        echo "❌ Failed to configure cron jobs"
        exit 1
    fi
fi

echo ""
echo "Log files location:"
echo "  - Memory: /home/ubuntu/construction_management_app/logs/memory-monitor.log"
echo "  - OOM: /home/ubuntu/construction_management_app/logs/oom-events.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove cron jobs: crontab -e (then delete the lines)"
