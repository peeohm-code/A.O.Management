import { checkAndTriggerEscalations } from "../db";
import { logger } from "../logger";

/**
 * Escalation Check Job
 * ตรวจสอบและส่งการแจ้งเตือน escalation อัตโนมัติ
 * ควรรันทุก 1 ชั่วโมง
 */
export async function runEscalationCheck() {
  try {
    logger.info("[EscalationJob] Starting escalation check...");
    await checkAndTriggerEscalations();
    logger.info("[EscalationJob] Escalation check completed successfully");
  } catch (error) {
    logger.error("[EscalationJob] Error during escalation check:", error);
  }
}

// ถ้ารันไฟล์นี้โดยตรง ให้เรียกใช้ฟังก์ชันทันที
if (require.main === module) {
  runEscalationCheck().then(() => {
    process.exit(0);
  }).catch((error) => {
    logger.error("[EscalationJob] Fatal error:", error);
    process.exit(1);
  });
}
