# Scheduled Jobs

This directory contains scheduled job scripts for background tasks.

## Auto-Archive Job

**File:** `autoArchiveJob.ts`

**Purpose:** Automatically archive projects based on configured rules (e.g., archive completed projects after 180 days).

### Quick Setup

Use the automated setup script:

```bash
bash server/jobs/setup-cron.sh
```

The script will guide you through:
- Verifying project paths
- Choosing a cron schedule
- Installing the cron job automatically (optional)
- Creating logs directory

### Manual Execution

```bash
cd /home/ubuntu/construction_management_app
pnpm tsx server/jobs/autoArchiveJob.ts
```

### Manual Cron Setup

1. Create logs directory:
```bash
mkdir -p /home/ubuntu/construction_management_app/logs
```

2. Edit crontab:
```bash
crontab -e
```

3. Add schedule (example: daily at 2 AM):
```bash
0 2 * * * cd /home/ubuntu/construction_management_app && pnpm tsx server/jobs/autoArchiveJob.ts >> /home/ubuntu/construction_management_app/logs/auto-archive.log 2>&1
```

4. Verify:
```bash
crontab -l
```

5. View logs:
```bash
tail -f /home/ubuntu/construction_management_app/logs/auto-archive.log
```

### Job Behavior

- Fetches all enabled archive rules from database
- For each rule, finds projects matching criteria
- Archives matching projects automatically
- Logs history in archiveHistory table
- Reports results to console/log file

---

## Archive Notification Job

**File:** `checkArchiveJob.ts`

**Purpose:** Check for archived projects approaching 5 years and send notifications to the owner.

### Manual Execution

```bash
cd /home/ubuntu/construction_management_app
pnpm tsx server/jobs/checkArchiveJob.ts
```

### Automated Scheduling (Cron)

Add to crontab to run every Monday at 9 AM:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed):
0 9 * * 1 cd /home/ubuntu/construction_management_app && pnpm tsx server/jobs/checkArchiveJob.ts >> /tmp/archive-job.log 2>&1
```

### Cron Schedule Examples

```
# Every Monday at 9 AM
0 9 * * 1

# Every day at 2 AM
0 2 * * *

# First day of every month at midnight
0 0 1 * *

# Every Sunday at 11 PM
0 23 * * 0
```

### Job Behavior

- Checks all archived projects
- Identifies projects archived for 4.5-5 years (warning period)
- Identifies projects archived for >5 years (ready to delete)
- Sends notification to owner if warnings found
- Logs results to console

### Notification Content

The notification includes:
- List of projects approaching 5 years (with days remaining)
- List of projects ready for deletion (>5 years)
- Reminder to download project data before deletion

### Testing

Test the job manually before setting up cron:

```bash
pnpm tsx server/jobs/checkArchiveJob.ts
```

Expected output:
```
[Archive Job] Starting archive warnings check...
[Archive Job] Time: 2025-11-09T02:20:00.000Z
[Archive Job] Check completed successfully
[Archive Job] Warnings sent: true
[Archive Job] Projects checked: 5
[Archive Job] Projects with warnings: 2
[Archive Job] Notification sent to owner
```
