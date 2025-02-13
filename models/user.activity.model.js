import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  activityType: { type: String, required: true }, // e.g., "login", "logout", "order_placed", "cart_updated"
  timestamp: { type: Date, default: Date.now },
});

export const UserActivity = mongoose.model("UserActivity", userActivitySchema);
