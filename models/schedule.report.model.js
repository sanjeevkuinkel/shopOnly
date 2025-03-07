import mongoose from "mongoose";

const scheduledReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    required: true,
  },
  reportType: {
    type: String,
    enum: ["sales", "inventory", "userActivity"], // Customize based on your needs
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  lastSent: {
    type: Date,
    default: null,
  },
  nextRun: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const ScheduledReport = mongoose.model(
  "ScheduledReport",
  scheduledReportSchema
);

export default ScheduledReport;
