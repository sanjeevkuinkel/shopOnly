import mongoose from "mongoose";
const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME,
  }, // Automatically delete after 7 days
});

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
