import { appRouter } from "./server/routers.ts";

console.log("Checking inspection router procedures...");
console.log("appRouter._def.procedures:", Object.keys(appRouter._def.procedures));

if (appRouter._def.procedures.inspection) {
  const inspectionProcedures = Object.keys(appRouter._def.procedures.inspection._def.procedures || {});
  console.log("Available procedures in inspection:", inspectionProcedures);

  if (inspectionProcedures.includes("updateChecklistItem")) {
    console.log("✓ updateChecklistItem found!");
  } else {
    console.log("✗ updateChecklistItem NOT found!");
  }
} else {
  console.log("✗ inspection router NOT found!");
}
