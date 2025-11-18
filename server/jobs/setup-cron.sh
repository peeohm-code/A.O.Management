#!/bin/bash

# Auto-Archive Cron Job Setup Script
# This script helps set up automatic execution of the auto-archive job

PROJECT_DIR="/home/ubuntu/construction_management_app"
JOB_SCRIPT="$PROJECT_DIR/server/jobs/autoArchiveJob.ts"

echo "========================================="
echo "Auto-Archive Cron Job Setup"
echo "========================================="
echo ""
echo "This script will help you set up a cron job to run the auto-archive job automatically."
echo ""
echo "Project Directory: $PROJECT_DIR"
echo "Job Script: $JOB_SCRIPT"
echo ""

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found at $PROJECT_DIR"
    exit 1
fi

# Check if job script exists
if [ ! -f "$JOB_SCRIPT" ]; then
    echo "❌ Error: Job script not found at $JOB_SCRIPT"
    exit 1
fi

echo "✅ Project and job script found"
echo ""

# Generate cron job command
CRON_COMMAND="cd $PROJECT_DIR && pnpm tsx $JOB_SCRIPT >> $PROJECT_DIR/logs/auto-archive.log 2>&1"

echo "========================================="
echo "Recommended Cron Schedule Options:"
echo "========================================="
echo ""
echo "1. Daily at 2:00 AM"
echo "   0 2 * * * $CRON_COMMAND"
echo ""
echo "2. Every Sunday at 3:00 AM"
echo "   0 3 * * 0 $CRON_COMMAND"
echo ""
echo "3. First day of every month at 1:00 AM"
echo "   0 1 1 * * $CRON_COMMAND"
echo ""
echo "4. Every 6 hours"
echo "   0 */6 * * * $CRON_COMMAND"
echo ""

echo "========================================="
echo "Manual Setup Instructions:"
echo "========================================="
echo ""
echo "1. Create logs directory (if not exists):"
echo "   mkdir -p $PROJECT_DIR/logs"
echo ""
echo "2. Open crontab editor:"
echo "   crontab -e"
echo ""
echo "3. Add one of the cron schedules above to the file"
echo ""
echo "4. Save and exit the editor"
echo ""
echo "5. Verify cron job is installed:"
echo "   crontab -l"
echo ""

echo "========================================="
echo "Quick Install (Daily at 2:00 AM):"
echo "========================================="
echo ""
read -p "Do you want to install the daily 2:00 AM cron job now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create logs directory
    mkdir -p "$PROJECT_DIR/logs"
    
    # Add cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * $CRON_COMMAND") | crontab -
    
    echo "✅ Cron job installed successfully!"
    echo ""
    echo "Current crontab:"
    crontab -l
else
    echo "ℹ️  Skipped automatic installation. Please follow the manual setup instructions above."
fi

echo ""
echo "========================================="
echo "Testing:"
echo "========================================="
echo ""
echo "To test the job manually, run:"
echo "  cd $PROJECT_DIR && pnpm tsx $JOB_SCRIPT"
echo ""
echo "To view logs:"
echo "  tail -f $PROJECT_DIR/logs/auto-archive.log"
echo ""
