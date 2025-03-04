import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Improves query performance for user-based lookups
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1, // Ensures quantity is positive
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export const Cart = mongoose.model("Cart", cartSchema);
