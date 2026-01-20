import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 6:00 AM: Check all products for low stock
crons.cron(
  "detect low stock",
  "0 6 * * *",
  internal.anomalyDetection.detectAllLowStock
);

// Daily at 7:00 AM: Find invoices without matching delivery notes (>14 days old)
crons.cron(
  "detect missing delivery notes",
  "0 7 * * *",
  internal.anomalyDetection.detectMissingDeliveryNotes
);

export default crons;
