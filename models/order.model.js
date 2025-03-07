import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Already indexed
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        cost: {
          type: Number,
          required: true, // Ensure cost is required
        },
      },
    ],
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
      index: true, // Add index for faster status filtering
    },
    customerType: {
      type: String,
      enum: ["new", "repeat"], // Track new vs. repeat customers
      required: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { key: { createdAt: 1 } }, // Index for date-based queries
      { key: { "items.productId": 1 } }, // Compound index for productId queries
    ],
  }
);

export const Order = mongoose.model("Order", orderSchema);
