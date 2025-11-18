#!/bin/bash

# collect-memory.sh
# สคริปต์สำหรับเก็บข้อมูล memory usage และบันทึกลง database

# กำหนด path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/logs/memory-monitor.log"
ERROR_LOG="$PROJECT_DIR/logs/memory-error.log"

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
log_message "Starting memory collection..."

# ดึงข้อมูล memory จาก /proc/meminfo
if [ ! -f /proc/meminfo ]; then
    log_error "/proc/meminfo not found"
    exit 1
fi

# อ่านข้อมูล memory
TOTAL_MEM=$(grep MemTotal /proc/meminfo | awk '{print $2}')
FREE_MEM=$(grep MemFree /proc/meminfo | awk '{print $2}')
AVAILABLE_MEM=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
BUFFERS=$(grep Buffers /proc/meminfo | awk '{print $2}')
CACHED=$(grep "^Cached:" /proc/meminfo | awk '{print $2}')
SWAP_TOTAL=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
SWAP_FREE=$(grep SwapFree /proc/meminfo | awk '{print $2}')

# แปลงจาก KB เป็น MB
TOTAL_MEM_MB=$((TOTAL_MEM / 1024))
FREE_MEM_MB=$((FREE_MEM / 1024))
AVAILABLE_MEM_MB=$((AVAILABLE_MEM / 1024))
BUFFERS_CACHE_MB=$(((BUFFERS + CACHED) / 1024))
SWAP_TOTAL_MB=$((SWAP_TOTAL / 1024))
SWAP_FREE_MB=$((SWAP_FREE / 1024))

# คำนวณ used memory
USED_MEM_MB=$((TOTAL_MEM_MB - FREE_MEM_MB))

# คำนวณ usage percentage
USAGE_PERCENTAGE=$((USED_MEM_MB * 100 / TOTAL_MEM_MB))

# คำนวณ swap free percentage
if [ $SWAP_TOTAL_MB -gt 0 ]; then
    SWAP_FREE_PERCENTAGE=$((SWAP_FREE_MB * 100 / SWAP_TOTAL_MB))
else
    SWAP_FREE_PERCENTAGE=0
fi

log_message "Memory stats: Total=${TOTAL_MEM_MB}MB, Used=${USED_MEM_MB}MB, Free=${FREE_MEM_MB}MB, Usage=${USAGE_PERCENTAGE}%"

# สร้าง JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "totalMemoryMB": $TOTAL_MEM_MB,
  "usedMemoryMB": $USED_MEM_MB,
  "freeMemoryMB": $FREE_MEM_MB,
  "usagePercentage": $USAGE_PERCENTAGE,
  "buffersCacheMB": $BUFFERS_CACHE_MB,
  "availableMemoryMB": $AVAILABLE_MEM_MB,
  "swapTotalMB": $SWAP_TOTAL_MB,
  "swapUsedMB": $((SWAP_TOTAL_MB - SWAP_FREE_MB)),
  "swapFreePercentage": $SWAP_FREE_PERCENTAGE
}
EOF
)

# บันทึกลง database ผ่าน Node.js script
cd "$PROJECT_DIR"
node -e "
const data = $JSON_PAYLOAD;
console.log('Saving memory data:', JSON.stringify(data, null, 2));

// TODO: เรียก API เพื่อบันทึกข้อมูล
// สามารถใช้ fetch หรือ axios เพื่อเรียก tRPC endpoint
// ตัวอย่าง: fetch('http://localhost:3000/api/trpc/memoryMonitoring.createLog', { method: 'POST', body: JSON.stringify(data) })
" 2>> "$ERROR_LOG"

if [ $? -eq 0 ]; then
    log_message "Memory data saved successfully"
else
    log_error "Failed to save memory data"
fi

# ตรวจสอบ high memory usage
if [ $USAGE_PERCENTAGE -ge 70 ]; then
    log_message "WARNING: High memory usage detected (${USAGE_PERCENTAGE}%)"
    
    # แสดง top 5 processes ที่ใช้ memory มากที่สุด
    log_message "Top 5 memory-consuming processes:"
    ps aux --sort=-%mem | head -6 | tail -5 >> "$LOG_FILE"
fi

log_message "Memory collection completed"
