#!/bin/bash

# detect-oom.sh
# สคริปต์สำหรับตรวจจับ OOM (Out of Memory) events จาก system logs

# กำหนด path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/oom-detector.log"
ERROR_LOG="$PROJECT_DIR/logs/oom-error.log"
STATE_FILE="$PROJECT_DIR/logs/oom-last-check.txt"

# สร้าง log directory ถ้ายังไม่มี
mkdir -p "$PROJECT_DIR/logs"

# ฟังก์ชัน log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$ERROR_LOG"
}

# เริ่มต้น
log_message "Starting OOM detection..."

# กำหนด system log paths ที่เป็นไปได้
SYSTEM_LOGS=(
    "/var/log/syslog"
    "/var/log/messages"
    "/var/log/kern.log"
    "/var/log/dmesg"
)

# หา log file ที่มีอยู่
ACTIVE_LOG=""
for log_path in "${SYSTEM_LOGS[@]}"; do
    if [ -f "$log_path" ] && [ -r "$log_path" ]; then
        ACTIVE_LOG="$log_path"
        break
    fi
done

if [ -z "$ACTIVE_LOG" ]; then
    # ถ้าไม่มี system log ให้ใช้ dmesg
    log_message "No system log file found, using dmesg"
    TEMP_LOG="/tmp/dmesg-$$.log"
    dmesg > "$TEMP_LOG" 2>/dev/null
    ACTIVE_LOG="$TEMP_LOG"
fi

# อ่าน timestamp ของการตรวจสอบครั้งล่าสุด
LAST_CHECK_TIME=""
if [ -f "$STATE_FILE" ]; then
    LAST_CHECK_TIME=$(cat "$STATE_FILE")
fi

# บันทึก timestamp ปัจจุบัน
date '+%Y-%m-%d %H:%M:%S' > "$STATE_FILE"

# ค้นหา OOM events
log_message "Checking for OOM events in: $ACTIVE_LOG"

# Pattern สำหรับตรวจจับ OOM
OOM_PATTERN="Out of memory|OOM killer|Killed process|oom-kill|Memory cgroup out of memory"

# ค้นหา OOM events
OOM_EVENTS=$(grep -iE "$OOM_PATTERN" "$ACTIVE_LOG" 2>/dev/null)

if [ -n "$OOM_EVENTS" ]; then
    log_message "Found OOM events:"
    
    # วิเคราะห์แต่ละ event
    while IFS= read -r line; do
        log_message "OOM Event: $line"
        
        # พยายามดึงข้อมูล process ที่ถูก kill
        KILLED_PROCESS=$(echo "$line" | grep -oP 'Killed process \K\d+' || echo "")
        PROCESS_NAME=$(echo "$line" | grep -oP '\[\K[^\]]+' | tail -1 || echo "")
        
        # กำหนด severity ตาม pattern
        SEVERITY="medium"
        if echo "$line" | grep -qi "critical\|panic"; then
            SEVERITY="critical"
        elif echo "$line" | grep -qi "cgroup"; then
            SEVERITY="high"
        fi
        
        # สร้าง JSON payload
        JSON_PAYLOAD=$(cat <<EOF
{
  "processName": "${PROCESS_NAME:-unknown}",
  "killedProcessId": ${KILLED_PROCESS:-0},
  "severity": "$SEVERITY",
  "logMessage": $(echo "$line" | jq -Rs .)
}
EOF
)
        
        log_message "Saving OOM event: $JSON_PAYLOAD"
        
        # บันทึกลง database ผ่าน Node.js script
        cd "$PROJECT_DIR"
        node -e "
const data = $JSON_PAYLOAD;
console.log('Saving OOM event:', JSON.stringify(data, null, 2));

// TODO: เรียก API เพื่อบันทึกข้อมูล
// ตัวอย่าง: fetch('http://localhost:3000/api/trpc/memoryMonitoring.createOomEvent', { method: 'POST', body: JSON.stringify(data) })
" 2>> "$ERROR_LOG"
        
    done <<< "$OOM_EVENTS"
    
    log_message "Processed $(echo "$OOM_EVENTS" | wc -l) OOM event(s)"
else
    log_message "No OOM events detected"
fi

# ลบ temp file ถ้ามี
if [ -f "/tmp/dmesg-$$.log" ]; then
    rm -f "/tmp/dmesg-$$.log"
fi

log_message "OOM detection completed"
