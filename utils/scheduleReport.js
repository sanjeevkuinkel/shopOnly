// scheduler.js
import cron from "node-cron";
import ScheduledReport from "./models/ScheduledReport.js";
import { sendEmail } from "./utils/emailService.js"; // Reuse the email service
import { generateReport } from "./utils/reportGenerator.js"; // Report generator

// Schedule a task to run every minute (for testing) or every hour (for production)
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    console.log("Checking for scheduled reports...");

    // Find all active reports where nextRun is due
    const reports = await ScheduledReport.find({
      isActive: true,
      nextRun: { $lte: now },
    }).populate("userId");

    for (const report of reports) {
      // Generate the report
      const reportData = await generateReport(report.userId, report.reportType);

      // Send the report via email
      await sendEmail({
        to: report.email,
        subject: `Scheduled ${report.reportType} Report`,
        text: `Here is your ${report.frequency} ${report.reportType} report.`,
        html: `<pre>${JSON.stringify(reportData, null, 2)}</pre>`, // Format as needed
      });

      console.log(`Report sent to ${report.email}`);

      // Update the nextRun date based on frequency
      let nextRunDate;
      switch (report.frequency) {
        case "daily":
          nextRunDate = new Date(now.setDate(now.getDate() + 1));
          break;
        case "weekly":
          nextRunDate = new Date(now.setDate(now.getDate() + 7));
          break;
        case "monthly":
          nextRunDate = new Date(now.setMonth(now.getMonth() + 1));
          break;
        default:
          nextRunDate = new Date(now.setDate(now.getDate() + 1));
      }

      // Update the report's lastSent and nextRun fields
      report.lastSent = now;
      report.nextRun = nextRunDate;
      await report.save();
    }
  } catch (error) {
    console.error("Error in scheduled report task:", error);
  }
});
