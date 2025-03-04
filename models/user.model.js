import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 8,
      maxlength: 30,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^\S+@\S+\.\S+$/,
      trim: true,
      lowercase: true,
    },
    loginAttempts: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 55,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 55,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    gender: {
      type: String,
      required: true,
      trim: true,
      enum: ["male", "female", "preferNotToSay"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 55,
    },
    role: {
      type: String,
      trim: true,
      enum: ["buyer", "seller", "admin"],
      default: "user",
    },
    passwordResetToken: {
      type: String, // This will store the reset token
    },
    passwordResetExpires: {
      type: Date, // This will store the expiration date of the token
    },
    passwordChangedAt: {
      type: Date, // This will store when the password was last changed
    },
    cart: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  {
    timestamps: true,
  }
);
export const User = mongoose.model("User", userSchema);
