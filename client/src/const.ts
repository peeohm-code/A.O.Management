export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "ระบบจัดการงานก่อสร้าง";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Project status labels
export const PROJECT_STATUS_LABELS = {
  planning: "วางแผน",
  in_progress: "กำลังดำเนินการ",
  on_hold: "หยุดชั่วคราว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
} as const;

// Task status labels
export const TASK_STATUS_LABELS = {
  todo: "รอดำเนินการ",
  in_progress: "กำลังทำ",
  review: "ตรวจสอบ",
  completed: "เสร็จสิ้น",
} as const;

// Task priority labels
export const TASK_PRIORITY_LABELS = {
  low: "ต่ำ",
  medium: "ปานกลาง",
  high: "สูง",
  urgent: "เร่งด่วน",
} as const;

// QC status labels
export const QC_STATUS_LABELS = {
  pending: "รอตรวจสอบ",
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
} as const;

// Status colors
export const PROJECT_STATUS_COLORS = {
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  on_hold: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

export const TASK_STATUS_COLORS = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
} as const;

export const TASK_PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

export const QC_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;